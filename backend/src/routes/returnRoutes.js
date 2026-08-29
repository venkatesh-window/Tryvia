import { Router } from "express";
import mongoose from "mongoose";
import { authenticate } from "../middleware/auth.js";
import { Return } from "../models/Return.js";
import { VendorLedger } from "../models/VendorLedger.js";
import { Order } from "../models/Order.js";
import { Notification } from "../models/Notification.js";
import { Vendor } from "../models/Vendor.js";
import { Product } from "../models/Product.js";

const router = Router();

// Middleware to get current vendor
const getVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user?._id });
    if (!vendor) {
      res.status(404).json({ detail: "Vendor account not found." });
      return;
    }
    if (vendor.status !== "APPROVED") {
      res
        .status(403)
        .json({ detail: `Access denied. Vendor status is ${vendor.status}.` });
      return;
    }
    req.vendor = vendor;
    next();
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user && (req.user.role === "ADMIN" || req.user.isSuperuser)) {
    next();
  } else {
    res
      .status(403)
      .json({ detail: "Access denied. Admin privileges required." });
  }
};

// ==========================================
// VENDOR ENDPOINTS
// ==========================================

// GET /api/v1/returns/vendor
router.get("/vendor", authenticate, getVendor, async (req, res) => {
  try {
    const vendor = req.vendor;
    const returns = await Return.find({ vendor: vendor._id })
      .populate("order", "numericId totalAmount createdAt")
      .populate("product", "name imageUrl")
      .populate("customer", "fullName email")
      .sort({ createdAt: -1 });
    res.json(returns.map((r) => r.toJSON()));
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// PATCH /api/v1/returns/vendor/:id/status
router.patch(
  "/vendor/:id/status",
  authenticate,
  getVendor,
  async (req, res) => {
    try {
      const vendor = req.vendor;
      const { status, note } = req.body;
      // Vendor can only APPROVE or REJECT from REQUESTED
      if (!["APPROVED", "REJECTED"].includes(status)) {
        res.status(400).json({ detail: "Invalid status for vendor action" });
        return;
      }

      const ret = await Return.findOne({
        _id: req.params.id,
        vendor: vendor._id,
      });
      if (!ret) {
        res.status(404).json({ detail: "Return request not found" });
        return;
      }

      if (ret.status !== "REQUESTED") {
        res
          .status(400)
          .json({ detail: "Return is no longer in REQUESTED state" });
        return;
      }

      ret.status = status;
      ret.history.push({
        status: status,
        changedBy: req.user?._id,
        note,
        changedAt: new Date(),
      });

      await ret.save();
      res.json(ret.toJSON());
    } catch (error) {
      res.status(500).json({ detail: error.message });
    }
  },
);

// ==========================================
// ADMIN ENDPOINTS
// ==========================================

// GET /api/v1/returns/admin
router.get("/admin", authenticate, requireAdmin, async (req, res) => {
  try {
    const returns = await Return.find()
      .populate("vendor", "storeName email")
      .populate("order", "numericId")
      .populate("product", "name")
      .populate("customer", "fullName")
      .sort({ createdAt: -1 });
    res.json(returns.map((r) => r.toJSON()));
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// PATCH /api/v1/returns/admin/:id/status
router.patch(
  "/admin/:id/status",
  authenticate,
  requireAdmin,
  async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { status, note } = req.body;
      const ret = await Return.findById(req.params.id).session(session);
      if (!ret) {
        res.status(404).json({ detail: "Return not found" });
        await session.abortTransaction();
        session.endSession();
        return;
      }

      ret.status = status;
      ret.history.push({
        status,
        changedBy: req.user?._id,
        note,
        changedAt: new Date(),
      });

      await ret.save({ session });

      // Handle financial adjustments on REFUNDED
      if (status === "REFUNDED") {
        // 1. Restore Inventory
        const product = await Product.findById(ret.product).session(session);
        if (product) {
          if (ret.itemType === "full") {
            product.stockFull += ret.quantity;
          } else {
            product.stockTester += ret.quantity;
          }
          await product.save({ session });
        }

        // 2. Adjust Vendor Ledger
        const ledgerEntry = new VendorLedger({
          vendor: ret.vendor,
          order: ret.order,
          orderItemProduct: ret.product,
          type: "REFUND",
          amount: -ret.vendorEarningsRefund, // Deduct earnings back
          platformFee: -ret.platformFeeRefund, // Adjust platform fee accounting
          status: "COMPLETED",
          reference: ret._id.toString(),
          notes: `Customer return refunded. Note: ${note || ""}`,
        });
        await ledgerEntry.save({ session });

        // Notify vendor
        await Notification.create(
          [
            {
              user: (await Vendor.findById(ret.vendor))?.user,
              title: "Return Refunded",
              description: `A return for order ${ret.order} has been refunded. $${ret.vendorEarningsRefund.toFixed(2)} has been deducted from your available balance.`,
              type: "RETURN",
              relatedEntityId: ret._id,
            },
          ],
          { session },
        );
      }

      await session.commitTransaction();
      res.json(ret.toJSON());
    } catch (error) {
      await session.abortTransaction();
      res.status(500).json({ detail: error.message });
    } finally {
      session.endSession();
    }
  },
);

// ==========================================
// TEST ENDPOINT FOR CREATING RETURNS
// ==========================================
router.post("/test-create", async (req, res) => {
  try {
    const { orderId, productId, customerReason } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).json({ detail: "Order not found" });
      return;
    }

    // Find the item
    const item = order.items.find((i) => i.product.toString() === productId);
    if (!item) {
      res.status(404).json({ detail: "Product not found in this order" });
      return;
    }

    const product = await Product.findById(productId);
    if (!product || !product.vendor) {
      res.status(400).json({ detail: "Product or vendor mapping invalid" });
      return;
    }

    const ret = new Return({
      order: order._id,
      vendor: product.vendor,
      customer: order.user,
      product: product._id,
      itemType: item.itemType,
      quantity: item.quantity,
      customerReason,
      status: "REQUESTED",
      refundAmount: item.totalPrice,
      platformFeeRefund: item.platformFee,
      vendorEarningsRefund: item.vendorEarnings,
      history: [{ status: "REQUESTED", note: "Customer initiated return" }],
    });

    await ret.save();

    // Notify vendor
    const vendor = await Vendor.findById(product.vendor);
    if (vendor) {
      await Notification.create({
        user: vendor.user,
        title: "New Return Request",
        description: `A customer has requested a return for ${product.name}.`,
        type: "RETURN",
        relatedEntityId: ret._id,
      });
    }

    res.json(ret.toJSON());
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

export default router;
