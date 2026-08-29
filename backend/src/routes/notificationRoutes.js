import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { Notification } from "../models/Notification.js";

const router = Router();

// GET /api/v1/notifications
router.get("/", authenticate, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const notifications = await Notification.find({ user: req.user?._id })
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json(notifications.map((n) => n.toJSON()));
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// GET /api/v1/notifications/unread-count
router.get("/unread-count", authenticate, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user?._id,
      read: false,
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// PATCH /api/v1/notifications/:id/read
router.patch("/:id/read", authenticate, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user?._id },
      { read: true },
      { new: true },
    );
    if (!notification) {
      res.status(404).json({ detail: "Notification not found" });
      return;
    }
    res.json(notification.toJSON());
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// POST /api/v1/notifications/mark-all-read
router.post("/mark-all-read", authenticate, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user?._id, read: false },
      { read: true },
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

export default router;
