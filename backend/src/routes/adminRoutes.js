import { Router } from "express";
import jwt from "jsonwebtoken";
import { Order } from "../models/Order.js";

const router = Router();
const ADMIN_PASSWORD = "0822";
const JWT_SECRET = process.env.JWT_SECRET || "tryvia_secret_jwt_key_super_secure_2026";

const requireAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ detail: "Not authenticated" });
    return;
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== "SUPER_ADMIN") {
      res.status(403).json({ detail: "Access denied" });
      return;
    }
    next();
  } catch (error) {
    res.status(401).json({ detail: "Invalid token" });
  }
};

// POST /api/v1/admin/login
router.post("/login", (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    const token = jwt.sign({ role: "SUPER_ADMIN" }, JWT_SECRET, { expiresIn: "24h" });
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
      res.json({ detail: "Tester status updated successfully" });
    } else {
      res.status(400).json({ detail: "No tester items found to update" });
    }
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

export default router;
