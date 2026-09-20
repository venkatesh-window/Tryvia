import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { User } from "../models/User.js";

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ detail: "Not authenticated" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({ detail: "Internal Server Error: Missing secret" });
      return;
    }

    const decoded = jwt.verify(token, secret);
    const sub = decoded?.sub;

    if (!sub) {
      res.status(401).json({ detail: "Invalid token payload" });
      return;
    }

    let user = null;
    if (typeof sub === "number" || (!isNaN(Number(sub)) && Number(sub) > 0)) {
      user = await User.findOne({ numericId: Number(sub) });
    } else if (mongoose.Types.ObjectId.isValid(sub)) {
      user = await User.findById(sub);
    } else {
      user = await User.findOne({ email: String(sub).toLowerCase() });
    }

    if (!user || !user.isActive) {
      res.status(401).json({ detail: "User not found or inactive" });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ detail: "Invalid or expired token" });
  }
};

export const requireVendor = async (req, res, next) => {
  if (!req.user) {
    res.status(401).json({ detail: "Not authenticated" });
    return;
  }
  if (req.user.role !== "VENDOR" && req.user.role !== "ADMIN") {
    res
      .status(403)
      .json({ detail: "Access denied: Vendor privileges required" });
    return;
  }
  next();
};
