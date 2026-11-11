import { Order } from "../models/Order.js";
import {
  razorpayClient,
  RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET,
} from "../config/razorpay.js";
import { fulfillOrder } from "./orderHelper.js";
import { clearProductCache } from "../routes/productRoutes.js";
import { clearStorefrontCatalogCache } from "../routes/storefrontRoutes.js";

const inFlightUserReconciliations = new Map();

function hasConfiguredRazorpayCredentials() {
  return Boolean(
    RAZORPAY_KEY_ID &&
      RAZORPAY_KEY_SECRET &&
      !RAZORPAY_KEY_ID.includes("unconfigured") &&
      !RAZORPAY_KEY_SECRET.includes("unconfigured"),
  );
}

/**
 * Queries Razorpay Orders API for a PENDING order's captured payment.
 * Used as a fallback when mobile deep-link verification was interrupted or webhook was missed.
 */
export async function reconcileOrderWithRazorpay(order) {
  if (!order || order.status !== "PENDING" || !order.razorpayOrderId) {
    return false;
  }
  if (!hasConfiguredRazorpayCredentials()) {
    return false;
  }

  try {
    const paymentsResponse = await razorpayClient.orders.fetchPayments(
      order.razorpayOrderId,
    );
    const items = Array.isArray(paymentsResponse?.items)
      ? paymentsResponse.items
      : [];
    const expectedPaise = Math.round((Number(order.totalAmount) || 0) * 100);

    const capturedPayment = items.find(
      (p) =>
        p &&
        p.status === "captured" &&
        Number(p.amount) >= expectedPaise &&
        (!p.currency || p.currency === "INR"),
    );

    if (!capturedPayment) {
      return false;
    }

    order.razorpayPaymentId = capturedPayment.id;
    if (capturedPayment.method) {
      order.paymentMethod = `Razorpay (${String(capturedPayment.method).toUpperCase()})`;
    } else if (!order.paymentMethod) {
      order.paymentMethod = "Razorpay Online";
    }
    await order.save();

    await fulfillOrder(order._id);
    clearProductCache();
    clearStorefrontCatalogCache();
    return true;
  } catch (err) {
    console.warn(
      `Razorpay reconciliation skipped/failed for order ${order.numericId || order._id}:`,
      err?.error?.description || err?.message || err,
    );
    return false;
  }
}

/**
 * Checks recent PENDING Razorpay orders for a user and fulfills any already-captured payments.
 */
export async function reconcilePendingRazorpayOrdersForUser(userId) {
  if (!userId || !hasConfiguredRazorpayCredentials()) {
    return 0;
  }

  const key = String(userId);
  if (inFlightUserReconciliations.has(key)) {
    return inFlightUserReconciliations.get(key);
  }

  const run = (async () => {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const pendingOrders = await Order.find({
      user: userId,
      status: "PENDING",
      razorpayOrderId: { $exists: true, $nin: ["", null] },
      createdAt: { $gte: fourteenDaysAgo },
    })
      .sort({ createdAt: -1 })
      .limit(10);

    if (pendingOrders.length === 0) {
      return 0;
    }

    let reconciledCount = 0;
    for (const order of pendingOrders) {
      const paid = await reconcileOrderWithRazorpay(order);
      if (paid) {
        reconciledCount += 1;
      }
    }
    return reconciledCount;
  })().finally(() => {
    inFlightUserReconciliations.delete(key);
  });

  inFlightUserReconciliations.set(key, run);
  return run;
}

