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

const router = Router();

// POST /api/v1/orders/
router.post("/", authenticate, async (req, res) => {
  try {
    const { items, paymentMethod, apply_wallet_credit_id, use_wallet, shippingAddress } = req.body;
    const user = req.user;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ detail: "Order must contain at least one item" });
      return;
    }

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

    let walletBalanceBefore = user.walletBalance || 0;
    let validWalletBalance = walletBalanceBefore;
    let maximumWalletUsage = 0;
    let walletUsed = 0;
    let productAmount = originalProductsTotal;
    let platformFee = 10;
    let deliveryCharge = 40;
    let totalAmount = subtotal;

    if (useWallet && validWalletBalance > 0 && originalProductsTotal > 0) {
      maximumWalletUsage = originalProductsTotal * 0.60;
      walletUsed = Math.min(validWalletBalance, maximumWalletUsage);
      productAmount = originalProductsTotal - walletUsed;
    }
    
    totalAmount = productAmount + platformFee + deliveryCharge + miniProductsTotal;

    const remainingWallet = walletBalanceBefore - walletUsed;
    let walletDiscount = walletUsed;

    const orderCount = await Order.countDocuments();
    const numericId = 8920 + orderCount + 1;
    const orderId = `TRY-ORD-${numericId.toString().padStart(6, '0')}`;
    const resolvedShippingAddress =
      shippingAddress || req.body.shipping_address || req.body.shippingAddress || undefined;

    const orderStatus = "PAID";

    const vendorStatuses = Array.from(uniqueVendors).map((vId) => ({
      vendor: new mongoose.Types.ObjectId(vId),
      status: orderStatus,
      history: [{ status: orderStatus, changedAt: new Date() }],
    }));

    // For simplicity we use the same generated orderId to update item's orderItemId to have true TRY-ORD connection if we wanted, but TRY-ITEM is fine.
    
    const order = new Order({
      numericId,
      orderId,
      user: user._id,
      items: orderItems,
      subtotal,
      walletDiscount,
      platformFee,
      deliveryCharge,
      totalAmount,
      status: orderStatus,
      paymentMethod:
        paymentMethod || "Tryvia Pay",
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

    // If order is PAID, fulfill it immediately!
    if (order.status === "PAID") {
      await fulfillOrder(order._id);
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
