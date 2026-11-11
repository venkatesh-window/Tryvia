import { Router } from "express";
import mongoose from "mongoose";
import { authenticate } from "../middleware/auth.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { WalletCredit } from "../models/WalletCredit.js";
import { WalletRule } from "../models/WalletRule.js";
import { User } from "../models/User.js";
import { SystemConfig } from "../models/SystemConfig.js";
import { fulfillOrder } from "../utils/orderHelper.js";
import { syncUserWalletBalance } from "../utils/walletHelper.js";
import { getNextNumericId } from "../utils/idGenerator.js";
import { clearProductCache } from "./productRoutes.js";
import { clearStorefrontCatalogCache } from "./storefrontRoutes.js";
import { z } from "zod";
import { validate } from "../middleware/validation.js";

const router = Router();

const orderSchema = z.object({
  body: z.object({
    items: z.array(z.object({
      product_id: z.string().or(z.number()),
      quantity: z.coerce.number().int().min(1).default(1),
      item_type: z.enum(["full", "tester"]).optional()
    }).passthrough()).min(1),
    paymentMethod: z.string().nullable().optional(),
    apply_wallet_credit_id: z.boolean().or(z.string()).or(z.number()).nullable().optional(),
    use_wallet: z.boolean().nullable().optional(),
    shippingAddress: z.object({
      fullName: z.string().optional(),
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      country: z.string().optional(),
      phone: z.string().optional(),
    }).passthrough().nullable().optional()
  }).passthrough()
});

// POST /api/v1/orders/
router.post("/", authenticate, validate(orderSchema), async (req, res) => {
  try {
    const { items, paymentMethod, apply_wallet_credit_id, use_wallet, shippingAddress } = req.body;
    const user = req.user;

    let subtotal = 0;
    const orderItems = [];
    const testerProductIds = [];
    const uniqueVendors = new Set();
    // Fetch global commission rate
    const systemConfig = (await SystemConfig.findOne()) || {
      platformCommissionRate: 0.15,
    };
    const commissionRate = systemConfig.platformCommissionRate;

    for (const item of items) {
      let productDoc;
      if (!isNaN(Number(item.product_id))) {
        productDoc = await Product.findOne({
          numericId: Number(item.product_id),
        });
      } else if (mongoose.Types.ObjectId.isValid(item.product_id)) {
        productDoc = await Product.findById(item.product_id);
      }

      if (!productDoc) {
        res
          .status(404)
          .json({ detail: `Product not found: ${item.product_id}` });
        return;
      }

      const itemType = item.item_type === "full" ? "full" : "tester";
      const unitPrice =
        itemType === "full" ? productDoc.fullPrice : productDoc.testerPrice;
      const qty = item.quantity || 1;
      const totalPrice = unitPrice * qty;
      if (itemType === "full" && productDoc.stockFull < qty) {
        res
          .status(400)
          .json({
            detail: `Insufficient stock for full size of ${productDoc.name}`,
          });
        return;
      }
      if (itemType === "tester" && productDoc.stockTester < qty) {
        res
          .status(400)
          .json({
            detail: `Insufficient stock for tester of ${productDoc.name}`,
          });
        return;
      }

      const itemPlatformFee = totalPrice * commissionRate;
      const vendorEarnings = totalPrice - itemPlatformFee;

      subtotal += totalPrice;

      let vendorIdStr = "";
      if (productDoc.vendor) {
        uniqueVendors.add(productDoc.vendor.toString());
        vendorIdStr = productDoc.vendorId || "";
      }

      const orderItemCount = orderItems.length + 1;
      const tempNumericId = Math.floor(Math.random() * 1000000);
      const orderItemId = `TRY-ITEM-${tempNumericId.toString().padStart(6, '0')}-${orderItemCount}`;

      orderItems.push({
        orderItemId,
        vendorId: vendorIdStr,
        product: productDoc._id,
        itemType,
        quantity: qty,
        unitPrice,
        totalPrice,
        platformFee: itemPlatformFee,
        vendorEarnings: vendorEarnings,
        itemStatus: "PENDING",
      });

      if (itemType === "tester") {
        testerProductIds.push(productDoc._id);
      }
    }

    // NEW SYSTEM WALLET CALCULATION
    const useWallet = use_wallet || !!apply_wallet_credit_id;
    const originalProductsTotal = orderItems
      .filter((item) => item.itemType === "full")
      .reduce((acc, item) => acc + item.totalPrice, 0);

    const miniProductsTotal = orderItems
      .filter((item) => item.itemType === "tester")
      .reduce((acc, item) => acc + item.totalPrice, 0);

    const validWalletBalance = await syncUserWalletBalance(user._id);
    let walletBalanceBefore = validWalletBalance;
    let maximumWalletUsage = 0;
    let walletUsed = 0;
    let productAmount = originalProductsTotal;

    if (useWallet && validWalletBalance > 0 && originalProductsTotal > 0) {
      maximumWalletUsage = originalProductsTotal * 0.60;
      walletUsed = Math.min(validWalletBalance, maximumWalletUsage);
      productAmount = originalProductsTotal - walletUsed;
    }

    let platformFee = 0;
    let deliveryCharge = 0;
    let taxAmount = 0;
    let totalAmount = 0;

    if (originalProductsTotal > 0) {
      platformFee = 10;
      deliveryCharge += 40;
      totalAmount += productAmount + platformFee + 40;
    }

    if (miniProductsTotal > 0) {
      if (miniProductsTotal < 200) {
        res.status(400).json({ detail: "Minimum tester order value is ₹200." });
        return;
      }
      taxAmount = miniProductsTotal * 0.18;
      deliveryCharge += 40;
      totalAmount += miniProductsTotal + taxAmount + 40;
    }

    const remainingWallet = walletBalanceBefore - walletUsed;
    let walletDiscount = walletUsed;

    const numericId = await getNextNumericId(Order, "order", 8920);
    const orderId = `TRY-ORD-${numericId.toString().padStart(6, '0')}`;
    const resolvedShippingAddress =
      shippingAddress || req.body.shipping_address || req.body.shippingAddress || undefined;

    const shouldAutoFulfill = totalAmount <= 0;

    const vendorStatuses = Array.from(uniqueVendors).map((vId) => ({
      vendor: new mongoose.Types.ObjectId(vId),
      status: "PENDING",
      history: [{ status: "PENDING", changedAt: new Date() }],
    }));

    const order = new Order({
      numericId,
      orderId,
      user: user._id,
      items: orderItems,
      subtotal,
      walletDiscount,
      platformFee,
      deliveryCharge,
      taxAmount,
      totalAmount,
      status: "PENDING",
      paymentMethod:
        paymentMethod || req.body.payment_method || "Tryvia Pay",
      appliedCreditId: apply_wallet_credit_id ? 1 : undefined,
      shippingAddress: resolvedShippingAddress,
      vendorStatuses,
      walletBalanceBefore,
      maximumWalletUsage,
      walletUsed,
      productAmount,
      walletBalanceAfter: remainingWallet
    });

    await order.save();

    // If order is 100% covered (zero payable), fulfill atomically so credits/stock/status update properly
    if (shouldAutoFulfill) {
      await fulfillOrder(order._id);
      clearProductCache();
      clearStorefrontCatalogCache();
    }


    // Populate order items product & brand
    const populatedOrder = await Order.findById(order._id).populate({
      path: "items.product",
      populate: { path: "brand" },
    });

    const responseJSON = populatedOrder?.toJSON() || order.toJSON();
    if (responseJSON.items && Array.isArray(responseJSON.items)) {
      responseJSON.items = responseJSON.items.map((i) => ({
        product_id: i.product?.numericId || i.product?._id || i.product,
        product_name: i.product?.name || "Luxury Formulation",
        product_image_url: i.product?.imageUrl || "",
        product_brand: i.product?.brand?.name || "TRYVIA",
        item_type: i.itemType,
        quantity: i.quantity,
        unit_price: i.unitPrice,
        total_price: i.totalPrice,
        item_status: i.itemStatus,
        shipment: i.shipment,
      }));
    }

    res.json(responseJSON);
  } catch (error) {
    console.error("Order creation error in backend:", error);
    res.status(500).json({ detail: error.message });
  }
});

// GET /api/v1/orders/
router.get("/", authenticate, async (req, res) => {
  try {
    const user = req.user;
    // Do not show PENDING orders that might be failed or abandoned payments
    const orders = await Order.find({ user: req.user._id, status: { $ne: "PENDING" } })
      .populate({
        path: "items.product",
        populate: { path: "brand" },
      })
      .sort({ createdAt: -1 });

    const result = orders.map((order) => {
      const json = order.toJSON();
      json.items = (json.items || []).map((i) => ({
        product_id: i.product?.numericId || i.product?._id || i.product,
        product_name: i.product?.name || "Luxury Formulation",
        product_image_url: i.product?.imageUrl || "",
        product_brand: i.product?.brand?.name || "TRYVIA",
        item_type: i.itemType,
        quantity: i.quantity,
        unit_price: i.unitPrice,
        total_price: i.totalPrice,
        item_status: i.itemStatus,
        shipment: i.shipment,
      }));
      return json;
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// GET /api/v1/orders/:id
router.get("/:id", authenticate, async (req, res) => {
  try {
    const user = req.user;
    const idParam =
      typeof req.params.id === "string"
        ? req.params.id
        : String(req.params.id || "");

    let query = { user: user._id };
    if (!isNaN(Number(idParam))) {
      query.numericId = Number(idParam);
    } else if (mongoose.Types.ObjectId.isValid(idParam)) {
      query._id = idParam;
    } else {
      res.status(404).json({ detail: "Order not found" });
      return;
    }

    const order = await Order.findOne(query).populate({
      path: "items.product",
      populate: { path: "brand" },
    });

    if (!order) {
      res.status(404).json({ detail: "Order not found" });
      return;
    }

    const responseJSON = order.toJSON();
    responseJSON.items = (responseJSON.items || []).map((i) => ({
      product_id: i.product?.numericId || i.product?._id || i.product,
      product_name: i.product?.name || "Luxury Formulation",
      product_image_url: i.product?.imageUrl || "",
      product_brand: i.product?.brand?.name || "TRYVIA",
      item_type: i.itemType,
      quantity: i.quantity,
      unit_price: i.unitPrice,
      total_price: i.totalPrice,
      item_status: i.itemStatus,
      shipment: i.shipment,
    }));

    res.json(responseJSON);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

export default router;
