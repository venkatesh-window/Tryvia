import { Router } from "express";
import mongoose from "mongoose";
import { authenticate } from "../middleware/auth.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { SystemConfig } from "../models/SystemConfig.js";
import {
  razorpayClient,
  RAZORPAY_KEY_ID,
  verifyRazorpaySignature,
  verifyWebhookSignature,
} from "../config/razorpay.js";
import { fulfillOrder } from "../utils/orderHelper.js";
import { syncUserWalletBalance } from "../utils/walletHelper.js";
import { getNextNumericId } from "../utils/idGenerator.js";
import {
  reconcileOrderWithRazorpay,
  reconcilePendingRazorpayOrdersForUser,
} from "../utils/paymentReconcile.js";
import { clearProductCache } from "./productRoutes.js";
import { clearStorefrontCatalogCache } from "./storefrontRoutes.js";
import { z } from "zod";
import { validate } from "../middleware/validation.js";
import { paymentLimiter } from "../middleware/rateLimiter.js";

const router = Router();

const checkoutSchema = z.object({
  body: z.object({
    items: z.array(z.object({
      product_id: z.string().or(z.number()),
      quantity: z.coerce.number().int().min(1).default(1),
      item_type: z.enum(["full", "tester"]).optional()
    }).passthrough()).min(1),
    use_wallet: z.boolean().nullable().optional(),
    apply_wallet_credit_id: z.boolean().or(z.string()).or(z.number()).nullable().optional(),
    shipping_address: z.any().nullable().optional(),
  }).passthrough()
});

// High-concurrency helper: Batch fetches all products for cart items in 1 query with .lean()
async function loadProductsBatch(items) {
  const numericIds = [];
  const objectIds = [];

  for (const item of items) {
    if (!item?.product_id) continue;
    if (!isNaN(Number(item.product_id))) {
      numericIds.push(Number(item.product_id));
    } else if (mongoose.Types.ObjectId.isValid(item.product_id)) {
      objectIds.push(item.product_id);
    }
  }

  const queryOr = [];
  if (numericIds.length > 0) queryOr.push({ numericId: { $in: numericIds } });
  if (objectIds.length > 0) queryOr.push({ _id: { $in: objectIds } });

  if (queryOr.length === 0) return new Map();

  const products = await Product.find({ $or: queryOr }).lean();
  const map = new Map();
  for (const p of products) {
    if (p.numericId !== undefined) map.set(String(p.numericId), p);
    if (p._id) map.set(p._id.toString(), p);
  }
  return map;
}

// GET /api/v1/payments/config - Returns Razorpay public Key ID
router.get("/config", (_req, res) => {
  res.json({
    key_id: RAZORPAY_KEY_ID,
    currency: "INR",
  });
});

// POST /api/v1/payments/checkout/calculate - Preview the checkout calculation
router.post("/checkout/calculate", authenticate, validate(checkoutSchema), async (req, res) => {
  try {
    const user = req.user;
    const { items, use_wallet } = req.body;

    let originalProductsTotal = 0;
    let miniProductsTotal = 0;
    let subtotal = 0;

    const productMap = await loadProductsBatch(items);

    for (const item of items) {
      if (!item.product_id) continue;
      const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
      const itemType = item.item_type === "tester" ? "tester" : "full";

      const productDoc = productMap.get(String(item.product_id));
      if (!productDoc) continue;

      const unitPrice = itemType === "tester" ? productDoc.testerPrice : productDoc.fullPrice;
      const totalPrice = unitPrice * quantity;

      if (itemType === "full") {
        originalProductsTotal += totalPrice;
      } else {
        miniProductsTotal += totalPrice;
      }
      subtotal += totalPrice;
    }

    const validWalletBalance = await syncUserWalletBalance(user._id);

    let walletUsed = 0;
    let maximumWalletUsage = 0;
    if (use_wallet && validWalletBalance > 0 && originalProductsTotal > 0) {
      maximumWalletUsage = originalProductsTotal * 0.60;
      walletUsed = Math.min(validWalletBalance, maximumWalletUsage);
    }

    const productAmount = originalProductsTotal - walletUsed;

    let platformFee = 0;
    let deliveryCharge = 0;
    let taxAmount = 0;
    let customerPayment = 0;

    if (originalProductsTotal > 0) {
      platformFee = 10;
      deliveryCharge += 40;
      customerPayment += productAmount + platformFee + 40;
    }

    if (miniProductsTotal > 0) {
      if (miniProductsTotal < 200) {
        res.status(400).json({ detail: "Minimum tester order value is ₹200." });
        return;
      }
      taxAmount = miniProductsTotal * 0.18;
      deliveryCharge += 40;
      customerPayment += miniProductsTotal + taxAmount + 40;
    }

    const remainingWallet = validWalletBalance - walletUsed;

    res.json({
      subtotal,
      productSubtotal: originalProductsTotal,
      testerSubtotal: miniProductsTotal,
      availableCredits: validWalletBalance,
      maximumWalletUsage,
      walletUsed,
      productAmount,
      platformFee,
      deliveryCharge,
      taxAmount,
      customerPayment,
      remainingWallet,
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// POST /api/v1/payments/create-order - Validates cart, calculates authoritative price & creates Razorpay Order
router.post("/create-order", paymentLimiter, authenticate, validate(checkoutSchema), async (req, res) => {
  try {
    const user = req.user;
    const { items, apply_wallet_credit_id, shipping_address } = req.body;

    let subtotal = 0;
    const orderItems = [];
    const uniqueVendors = new Set();

    const productMap = await loadProductsBatch(items);
    const systemConfig = (await SystemConfig.findOne().lean()) || {
      platformCommissionRate: 0.15,
    };
    const commissionRate = systemConfig.platformCommissionRate ?? 0.15;

    for (const item of items) {
      if (!item.product_id) {
        res
          .status(400)
          .json({ detail: "Every item must have a valid product_id" });
        return;
      }

      const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
      const itemType = item.item_type === "tester" ? "tester" : "full";

      const productDoc = productMap.get(String(item.product_id));

      if (!productDoc) {
        res
          .status(400)
          .json({
            detail: `Product with ID "${item.product_id}" was not found in catalog.`,
          });
        return;
      }

      if (productDoc.status === "INACTIVE") {
        res.status(400).json({
          detail: `${productDoc.name} is currently unavailable.`,
        });
        return;
      }

      if (itemType === "full" && (productDoc.stockFull ?? 0) < quantity) {
        res.status(400).json({
          detail: `Insufficient stock for full size of ${productDoc.name}.`,
        });
        return;
      }

      if (itemType === "tester" && (productDoc.stockTester ?? 0) < quantity) {
        res.status(400).json({
          detail: `Insufficient stock for tester of ${productDoc.name}.`,
        });
        return;
      }

      // Collect vendor reference for cross-portal order routing
      if (productDoc.vendor) {
        uniqueVendors.add(productDoc.vendor.toString());
      }

      // Authoritative unit price from database
      const unitPrice =
        itemType === "tester" ? productDoc.testerPrice : productDoc.fullPrice;
      const totalPrice = unitPrice * quantity;
      const itemPlatformFee = Math.round(totalPrice * commissionRate * 100) / 100;
      const vendorEarnings = Math.round((totalPrice - itemPlatformFee) * 100) / 100;

      subtotal += totalPrice;

      orderItems.push({
        orderItemId: `TRY-ITEM-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        product: productDoc._id,
        vendorId: productDoc.vendorId,
        itemType,
        quantity,
        unitPrice,
        totalPrice,
        platformFee: itemPlatformFee,
        vendorEarnings,
        itemStatus: "PENDING",
      });
    }

    // NEW SYSTEM WALLET CALCULATION
    const useWallet = req.body.use_wallet || !!apply_wallet_credit_id;
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

    const remainingWallet = validWalletBalance - walletUsed;
    let walletDiscount = walletUsed;

    const numericId = await getNextNumericId(Order, "order", 8920);

    // Standard Razorpay Gateway Order (amount in paise, minimum 100 paise = ₹1)
    const amountInPaise = Math.round(totalAmount * 100);
    if (!Number.isInteger(amountInPaise) || amountInPaise <= 0) {
      res.status(400).json({ detail: "Invalid calculated payment amount" });
      return;
    }

    const receipt = `trv_${numericId}_${Date.now().toString().slice(-4)}`;
    let razorpayOrder;

    try {
      razorpayOrder = await razorpayClient.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: receipt.slice(0, 40),
        notes: {
          order_numeric_id: numericId.toString(),
          user_id: user._id.toString(),
          user_email: user.email || "",
        },
      });
    } catch (rzpErr) {
      console.error("Razorpay order creation failure:", {
        statusCode: rzpErr.statusCode,
        code: rzpErr.error?.code,
        description: rzpErr.error?.description || rzpErr.message,
      });
      const description = rzpErr.error?.description || rzpErr.message;
      let detailMsg = description || "Unable to create Razorpay payment order";
      if (description === "Authentication failed" || rzpErr.statusCode === 401) {
        detailMsg = "Razorpay Gateway Authentication Failed: The configured RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is invalid or expired. Please update them in your Razorpay Dashboard.";
      }
      res.status(400).json({
        detail: detailMsg,
      });
      return;
    }

    const orderId = `TRY-ORD-${numericId.toString().padStart(6, '0')}`;
    const vendorStatuses = Array.from(uniqueVendors).map((vId) => ({
      vendor: new mongoose.Types.ObjectId(vId),
      status: "PENDING",
      history: [{ status: "PENDING", changedAt: new Date() }],
    }));

    // Save preliminary order in PENDING status
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
      vendorStatuses,
      paymentMethod: "Razorpay Online",
      appliedCreditId: apply_wallet_credit_id ? 1 : undefined,
      shippingAddress: shipping_address || undefined,
      razorpayOrderId: razorpayOrder.id,
      walletBalanceBefore,
      maximumWalletUsage,
      walletUsed,
      productAmount,
      walletBalanceAfter: remainingWallet
    });

    await order.save();

    res.json({
      success: true,
      is_zero_amount: false,
      razorpay_order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key_id: RAZORPAY_KEY_ID,
      order_id: numericId,
      order_db_id: order._id,
      customer: {
        name: user.fullName || "TryVia Member",
        email: user.email || "",
        contact: user.phone || "",
      },
    });
  } catch (error) {
    console.error("Payment order creation error:", error);
    res
      .status(500)
      .json({ detail: error.message || "Failed to create payment order" });
  }
});

async function populateOrder(orderId) {
  return Order.findById(orderId).populate({
    path: "items.product",
    populate: { path: "brand" },
  });
}

async function completeVerifiedOrder(
  order,
  { razorpay_order_id, razorpay_payment_id, razorpay_signature, payment_instrument },
) {
  if (order.razorpayOrderId && order.razorpayOrderId !== razorpay_order_id) {
    return { errorStatus: 400, detail: "Razorpay order ID mismatch." };
  }

  const isSignatureValid = verifyRazorpaySignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  );

  if (!isSignatureValid) {
    console.warn(
      "Invalid Razorpay signature submitted for order:",
      order.numericId,
    );
    return {
      errorStatus: 400,
      detail: "Invalid payment signature. Transaction could not be verified.",
    };
  }

  if (order.status === "PAID") {
    const populatedOrder = await populateOrder(order._id);
    return {
      alreadyPaid: true,
      order: populatedOrder?.toJSON() || order.toJSON(),
    };
  }

  order.paymentMethod = payment_instrument || "Razorpay Online";
  order.razorpayOrderId = razorpay_order_id;
  order.razorpayPaymentId = razorpay_payment_id;
  order.razorpaySignature = razorpay_signature;
  await order.save();

  await fulfillOrder(order._id);
  clearProductCache();
  clearStorefrontCatalogCache();

  const populatedOrder = await populateOrder(order._id);
  return {
    alreadyPaid: false,
    order: populatedOrder?.toJSON() || order.toJSON(),
  };
}

// POST /api/v1/payments/verify - Verifies HMAC-SHA256 payment signature & completes order idempotently
router.post("/verify", paymentLimiter, authenticate, async (req, res) => {
  try {
    const user = req.user;
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id,
      payment_instrument,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400).json({
        detail:
          "Missing required Razorpay payment credentials (order ID, payment ID, or signature)",
      });
      return;
    }

    let query = { user: user._id };
    if (order_id) {
      if (!isNaN(Number(order_id))) {
        query.numericId = Number(order_id);
      } else if (mongoose.Types.ObjectId.isValid(order_id)) {
        query._id = order_id;
      }
    } else {
      query.razorpayOrderId = razorpay_order_id;
    }

    const order = await Order.findOne(query);

    if (!order) {
      res
        .status(404)
        .json({ detail: "Order record not found for verification" });
      return;
    }

    const outcome = await completeVerifiedOrder(order, {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      payment_instrument,
    });

    if (outcome.errorStatus) {
      res.status(outcome.errorStatus).json({ detail: outcome.detail });
      return;
    }

    res.json({
      success: true,
      message: outcome.alreadyPaid
        ? "Order already verified and paid"
        : "Payment verified and order confirmed successfully",
      order: outcome.order,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    res
      .status(500)
      .json({ detail: error.message || "Payment verification failed" });
  }
});

// POST /api/v1/payments/checkout-session/complete - Immediate signature-authenticated fulfillment from hosted checkout
router.post("/checkout-session/complete", paymentLimiter, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id,
      payment_instrument,
    } = req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400).json({
        detail:
          "Missing required Razorpay payment credentials (order ID, payment ID, or signature)",
      });
      return;
    }

    const query = { razorpayOrderId: String(razorpay_order_id) };
    if (order_id && !isNaN(Number(order_id))) {
      query.numericId = Number(order_id);
    }

    const order = await Order.findOne(query);
    if (!order) {
      res.status(404).json({ detail: "Order record not found" });
      return;
    }

    const outcome = await completeVerifiedOrder(order, {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      payment_instrument: payment_instrument || "Razorpay Mobile",
    });

    if (outcome.errorStatus) {
      res.status(outcome.errorStatus).json({ detail: outcome.detail });
      return;
    }

    res.json({
      success: true,
      message: outcome.alreadyPaid
        ? "Order already verified and paid"
        : "Payment verified and order confirmed successfully",
    });
  } catch (error) {
    console.error("Hosted checkout completion error:", error);
    res
      .status(500)
      .json({ detail: error.message || "Checkout verification failed" });
  }
});

// POST /api/v1/payments/reconcile - Reconciles PENDING Razorpay order(s) directly against Razorpay API
router.post("/reconcile", paymentLimiter, authenticate, async (req, res) => {
  try {
    const { order_id, razorpay_order_id } = req.body || {};

    if (order_id || razorpay_order_id) {
      const query = { user: req.user._id };
      if (order_id && !isNaN(Number(order_id))) {
        query.numericId = Number(order_id);
      } else if (order_id && mongoose.Types.ObjectId.isValid(order_id)) {
        query._id = order_id;
      } else if (razorpay_order_id) {
        query.razorpayOrderId = String(razorpay_order_id);
      }

      const order = await Order.findOne(query);
      if (!order) {
        res.status(404).json({ detail: "Order not found" });
        return;
      }

      if (order.status === "PENDING" && order.razorpayOrderId) {
        await reconcileOrderWithRazorpay(order);
      }

      const refreshed = await populateOrder(order._id);
      const isPaid = refreshed?.status && refreshed.status !== "PENDING";
      res.json({
        success: true,
        paid: Boolean(isPaid),
        order: isPaid ? refreshed.toJSON() : null,
      });
      return;
    }

    const reconciledCount = await reconcilePendingRazorpayOrdersForUser(
      req.user._id,
    );
    res.json({
      success: true,
      paid: reconciledCount > 0,
      reconciledCount,
    });
  } catch (error) {
    console.error("Payment reconcile error:", error);
    res.status(500).json({ detail: error.message || "Reconciliation failed" });
  }
});

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// GET /api/v1/payments/checkout-session/:orderId - Hosted Live Razorpay Checkout Page for Native Mobile
router.get("/checkout-session/:orderId", authenticate, async (req, res) => {
  try {
    const orderId = String(req.params.orderId);
    let query = {};
    if (!isNaN(Number(orderId))) {
      query.numericId = Number(orderId);
    } else if (mongoose.Types.ObjectId.isValid(orderId)) {
      query._id = orderId;
    } else {
      query.razorpayOrderId = orderId;
    }

    const order = await Order.findOne(query).populate("user");
    if (!order || !order.razorpayOrderId) {
      res.status(404).send("<h3>Order session not found</h3>");
      return;
    }

    // IDOR protection: Verify authenticated caller owns this order (or is admin)
    const isOwner = order.user && order.user._id && order.user._id.equals(req.user._id);
    const isAdmin = req.user.role === "ADMIN" || req.user.isSuperuser;
    if (!isOwner && !isAdmin) {
      res.status(403).send("<h3>Access denied: You do not have authorization to view this checkout session.</h3>");
      return;
    }

    // Explicitly configure headers for Razorpay checkout session to allow 3DS bank OTP frames and popup communication
    res.removeHeader("Cross-Origin-Opener-Policy");
    res.removeHeader("Cross-Origin-Embedder-Policy");
    res.setHeader(
      "Content-Security-Policy",
      "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; " +
      "script-src * 'unsafe-inline' 'unsafe-eval' data: blob:; " +
      "connect-src * 'unsafe-inline' data: blob:; " +
      "img-src * data: blob: https:; " +
      "frame-src * data: blob: https:; " +
      "child-src * data: blob: https:; " +
      "style-src * 'unsafe-inline'; " +
      "form-action *;"
    );
    res.setHeader("Cross-Origin-Opener-Policy", "unsafe-none");

    const user = order.user || {};
    const amountInPaise = Math.round(order.totalAmount * 100);

    const rawCallbackUrl = typeof req.query.callback_url === "string" ? req.query.callback_url.trim() : "";
    const allowedSchemes = ["tryvia://", "mobile://", "exp://", "exp+mobile://", "https://", "http://"];
    const callbackBase = allowedSchemes.some((scheme) => rawCallbackUrl.toLowerCase().startsWith(scheme))
      ? rawCallbackUrl
      : "tryvia://payment-callback";

    const safeAmount = escapeHtml(order.totalAmount.toFixed(2));
    const safeKeyId = JSON.stringify(RAZORPAY_KEY_ID);
    const safeRzpOrderId = JSON.stringify(order.razorpayOrderId);
    const safeCustomerName = JSON.stringify(user.fullName || "TryVia Member");
    const safeCustomerEmail = JSON.stringify(user.email || "");
    const safeCustomerPhone = JSON.stringify(user.phone || "");
    const safeNumericId = JSON.stringify(String(order.numericId));
    const safeCallbackBase = JSON.stringify(callbackBase);

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>TryVia Secure Checkout</title>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #FAF8F5;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
    }
    .card {
      background: #FFFFFF;
      border: 1px solid #ECE7E1;
      border-radius: 20px;
      padding: 28px;
      text-align: center;
      max-width: 360px;
      width: 100%;
      box-shadow: 0 10px 25px rgba(0,0,0,0.05);
    }
    .title { font-size: 20px; font-weight: 700; color: #1A1918; margin-bottom: 6px; letter-spacing: 1px; }
    .subtitle { font-size: 13px; color: #8E8A85; margin-bottom: 20px; }
    .amount { font-size: 32px; font-weight: 800; color: #1A1918; margin-bottom: 16px; }
    .status-msg { font-size: 13px; color: #666; margin-bottom: 18px; min-height: 20px; line-height: 1.4; }
    .btn {
      background: #1A1918;
      color: #FFFFFF;
      border: none;
      padding: 16px 24px;
      border-radius: 30px;
      font-size: 15px;
      font-weight: 600;
      width: 100%;
      cursor: pointer;
      display: inline-block;
      box-sizing: border-box;
      text-decoration: none;
    }
    .btn-secondary {
      background: #8E8A85;
      margin-top: 10px;
    }
    .loader {
      border: 3px solid #f3f3f3;
      border-top: 3px solid #1A1918;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      animation: spin 1s linear infinite;
      margin: 20px auto 0;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="card">
    <div class="title">TRYVIA</div>
    <div class="subtitle">HAUTE PARFUMERIE & LUXURY BEAUTY</div>
    <div class="amount">₹${safeAmount}</div>
    <div id="status-msg" class="status-msg">Opening secure Razorpay payment window...</div>
    <button id="pay-btn" class="btn" onclick="openRazorpay()">Complete Payment</button>
    <a id="return-btn" class="btn" style="display:none; margin-top: 14px;">Return to TryVia App</a>
    <div id="loader" class="loader"></div>
  </div>

  <script>
    var callbackBase = ${safeCallbackBase};

    function buildCallbackUrl(params) {
      var sep = callbackBase.indexOf('?') === -1 ? '?' : '&';
      var parts = [];
      for (var key in params) {
        if (params.hasOwnProperty(key) && params[key] !== undefined && params[key] !== null) {
          parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
        }
      }
      return callbackBase + sep + parts.join('&');
    }

    function navigateToCallback(url, msg) {
      var statusMsg = document.getElementById('status-msg');
      if (statusMsg) statusMsg.innerText = msg;
      var returnBtn = document.getElementById('return-btn');
      if (returnBtn) {
        returnBtn.href = url;
        returnBtn.style.display = 'inline-block';
      }
      var payBtn = document.getElementById('pay-btn');
      if (payBtn) payBtn.style.display = 'none';
      var loader = document.getElementById('loader');
      if (loader) loader.style.display = 'block';

      try {
        window.location.href = url;
      } catch (e) {
        console.error("Navigation error:", e);
      }
    }

    function openRazorpay() {
      var options = {
        key: ${safeKeyId},
        amount: ${amountInPaise},
        currency: "INR",
        name: "TRYVIA",
        description: "Luxury Beauty & Discovery Formulations",
        order_id: ${safeRzpOrderId},
        image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=200",
        prefill: {
          name: ${safeCustomerName},
          email: ${safeCustomerEmail},
          contact: ${safeCustomerPhone}
        },
        theme: { color: "#1A1918" },
        handler: async function (response) {
          var statusMsg = document.getElementById('status-msg');
          if (statusMsg) statusMsg.innerText = "Confirming your order securely...";
          var payBtn = document.getElementById('pay-btn');
          if (payBtn) payBtn.style.display = 'none';
          var loader = document.getElementById('loader');
          if (loader) loader.style.display = 'block';

          var payload = {
            razorpay_order_id: response.razorpay_order_id || ${safeRzpOrderId},
            razorpay_payment_id: response.razorpay_payment_id || "",
            razorpay_signature: response.razorpay_signature || "",
            order_id: ${safeNumericId},
            payment_instrument: "Razorpay Mobile"
          };

          var serverVerified = false;
          try {
            var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
            var timeoutId = controller ? setTimeout(function () { controller.abort(); }, 10000) : null;
            var res = await fetch('/api/v1/payments/checkout-session/complete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              keepalive: true,
              signal: controller ? controller.signal : undefined,
              body: JSON.stringify(payload)
            });
            if (timeoutId) clearTimeout(timeoutId);
            if (res && res.ok) {
              serverVerified = true;
            }
          } catch (verifyErr) {
            console.error("Hosted session verify fallback:", verifyErr);
          }

          var targetUrl = buildCallbackUrl({
            razorpay_order_id: payload.razorpay_order_id,
            razorpay_payment_id: payload.razorpay_payment_id,
            razorpay_signature: payload.razorpay_signature,
            order_id: payload.order_id,
            verified: serverVerified ? "1" : "0"
          });
          navigateToCallback(targetUrl, "Payment confirmed! Returning to TryVia...");
        },
        modal: {
          ondismiss: function () {
            var targetUrl = buildCallbackUrl({
              status: "cancelled",
              order_id: ${safeNumericId}
            });
            navigateToCallback(targetUrl, "Payment cancelled. Returning to TryVia...");
          }
        }
      };

      var rzp = new Razorpay(options);
      rzp.on('payment.failed', function (response){
        var desc = (response && response.error && response.error.description) ? response.error.description : 'Payment Failed';
        var targetUrl = buildCallbackUrl({
          status: "failed",
          error: desc,
          order_id: ${safeNumericId}
        });
        navigateToCallback(targetUrl, "Payment failed: " + desc);
      });
      rzp.open();
    }

    // Auto-trigger on page load
    window.onload = function() {
      setTimeout(openRazorpay, 300);
    };
  </script>
</body>
</html>
    `;

    res.send(html);
  } catch (err) {
    res.status(500).send("<h3>Error loading payment session</h3>");
  }
});

// POST /api/v1/payments/webhook - Webhook handler for async Razorpay updates
router.post("/webhook", async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    if (!signature) {
      res.status(401).json({ detail: "Missing x-razorpay-signature header" });
      return;
    }

    const rawPayload = req.rawBody || JSON.stringify(req.body);
    const isValid = verifyWebhookSignature(rawPayload, signature);
    if (!isValid) {
      res.status(400).json({ detail: "Invalid webhook signature" });
      return;
    }

    // Replay attack prevention: verify event timestamp freshness (within 10 minutes)
    const eventCreatedAt = req.body?.created_at;
    if (eventCreatedAt && typeof eventCreatedAt === "number") {
      const ageSeconds = Math.floor(Date.now() / 1000) - eventCreatedAt;
      if (Math.abs(ageSeconds) > 600) {
        res.status(400).json({ detail: "Webhook event timestamp expired or invalid" });
        return;
      }
    }

    const event = req.body?.event;
    const paymentEntity = req.body?.payload?.payment?.entity;

    if (event === "payment.captured" && paymentEntity) {
      const razorpayOrderId = paymentEntity.order_id;
      if (razorpayOrderId) {
        const order = await Order.findOne({ razorpayOrderId });
        if (order && order.status !== "PAID") {
          order.razorpayPaymentId = paymentEntity.id;
          await order.save();
          await fulfillOrder(order._id);
          clearProductCache();
          clearStorefrontCatalogCache();
        }
      }
    }

    res.json({ status: "ok" });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({ detail: "Internal Server Error" });
  }
});

export default router;
