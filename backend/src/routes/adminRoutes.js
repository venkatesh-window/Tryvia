import { Router } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Order } from "../models/Order.js";
import { Vendor } from "../models/Vendor.js";
import { AuditLog } from "../models/AuditLog.js";
import { adminLimiter } from "../middleware/rateLimiter.js";

const router = Router();

export const verifyAdminPassword = (candidatePassword, masterPassword) => {
  if (!candidatePassword || !masterPassword) return false;
  const inputHash = crypto.createHash("sha256").update(String(candidatePassword)).digest();
  const targetHash = crypto.createHash("sha256").update(String(masterPassword)).digest();
  return crypto.timingSafeEqual(inputHash, targetHash);
};

const requireAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ detail: "Not authenticated" });
    return;
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "SUPER_ADMIN") {
      res.status(403).json({ detail: "Access denied" });
      return;
    }
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({ detail: "Invalid token" });
  }
};

// POST /api/v1/admin/login
router.post("/login", adminLimiter, (req, res) => {
  const { password } = req.body;
  
  if (!process.env.ADMIN_PASSWORD) {
    res.status(500).json({ detail: "Server misconfiguration" });
    return;
  }
  
  if (verifyAdminPassword(password, process.env.ADMIN_PASSWORD)) {
    const token = jwt.sign({ role: "SUPER_ADMIN" }, process.env.JWT_SECRET, { expiresIn: "24h" });
    res.json({ token });
  } else {
    res.status(401).json({ detail: "Invalid credentials" });
  }
});

// GET /api/v1/admin/orders/products
router.get("/orders/products", requireAdmin, async (req, res) => {
  try {
    const orders = await Order.find({ "items.itemType": "full", status: { $ne: "PENDING" } })
      .populate("user", "fullName email phone")
      .populate("items.product", "name imageUrl numericId")
      .sort({ createdAt: -1 });
    
    // Filter out tester items to only return full products
    const formattedOrders = orders.map(order => {
      const orderJson = order.toJSON();
      orderJson.items = orderJson.items.filter(i => i.itemType === "full");
      return orderJson;
    }).filter(o => o.items.length > 0);
    
    res.json(formattedOrders);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// GET /api/v1/admin/orders/minis
router.get("/orders/minis", requireAdmin, async (req, res) => {
  try {
    const orders = await Order.find({ "items.itemType": "tester", status: { $ne: "PENDING" } })
      .populate("user", "fullName email phone")
      .populate("items.product", "name imageUrl numericId")
      .sort({ createdAt: -1 });

    const formattedOrders = orders.map(order => {
      const orderJson = order.toJSON();
      orderJson.items = orderJson.items.filter(i => i.itemType === "tester");
      return orderJson;
    }).filter(o => o.items.length > 0);

    res.json(formattedOrders);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// PATCH /api/v1/admin/minis/orders/:id/status
router.patch("/minis/orders/:id/status", requireAdmin, async (req, res) => {
  try {
    const { status, trackingNumber, itemId } = req.body;
    
    if (!["PENDING", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"].includes(status) && status !== "ACCEPTED") {
       // Note: frontend might send "ACCEPTED", which we can map to "PROCESSING" or just use "PROCESSING" directly.
       // The prompt says "Pending -> Accepted -> Processing -> Shipped -> Delivered".
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404).json({ detail: "Order not found" });
      return;
    }

    let updated = false;
    order.items.forEach(item => {
      if (item.itemType === "tester") {
        if (!itemId || item.orderItemId === itemId || item._id?.toString() === itemId) {
          item.itemStatus = status === "ACCEPTED" ? "PROCESSING" : status;
          if (trackingNumber || status === "SHIPPED") {
            item.shipment = item.shipment || {};
            if (trackingNumber) item.shipment.trackingNumber = trackingNumber;
            if (status === "SHIPPED" && !item.shipment.shippedAt) item.shipment.shippedAt = new Date();
          }
          updated = true;
        }
      }
    });

    if (updated) {
      await order.save();
      await AuditLog.create({
        actorRole: "SUPER_ADMIN",
        action: "UPDATE_MINIS_ORDER_STATUS",
        targetType: "Order",
        targetId: order._id.toString(),
        ipAddress: req.ip || req.headers["x-forwarded-for"],
        userAgent: req.headers["user-agent"],
        details: {
          status: status === "ACCEPTED" ? "PROCESSING" : status,
          trackingNumber,
          itemId,
        },
      });
      res.json({ detail: "Tester status updated successfully" });
    } else {
      res.status(400).json({ detail: "No tester items found to update" });
    }
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// PATCH /api/v1/admin/vendors/:id/status
router.patch("/vendors/:id/status", requireAdmin, async (req, res) => {
  try {
    const { status, reason } = req.body;
    if (!["APPROVED", "REJECTED", "SUSPENDED", "PENDING"].includes(status)) {
      res.status(400).json({ detail: "Invalid vendor status" });
      return;
    }
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      res.status(404).json({ detail: "Vendor not found" });
      return;
    }
    vendor.status = status;
    vendor.statusHistory = vendor.statusHistory || [];
    vendor.statusHistory.push({
      status,
      changedAt: new Date(),
      reason: reason || "Admin Status Update",
    });
    await vendor.save();
    await AuditLog.create({
      actorRole: "SUPER_ADMIN",
      action: "UPDATE_VENDOR_STATUS",
      targetType: "Vendor",
      targetId: vendor._id.toString(),
      ipAddress: req.ip || req.headers["x-forwarded-for"],
      userAgent: req.headers["user-agent"],
      details: { status, reason },
    });
    res.json({ detail: "Vendor status updated successfully", vendor: vendor.toJSON() });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

export default router;
