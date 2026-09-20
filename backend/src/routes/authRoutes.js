import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { User } from "../models/User.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validation.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router = Router();

const generateToken = (numericId) => {
  const secret =
    process.env.JWT_SECRET || "tryvia_secret_jwt_key_super_secure_2026";
  return jwt.sign({ sub: numericId }, secret, { expiresIn: "7d" });
};

const loginSchema = z.object({
  body: z.object({
    username: z.string().optional(),
    email: z.string().email().optional(),
    password: z.string().min(1, "Password is required"),
  })
});

// POST /api/v1/auth/login
router.post("/login", authLimiter, validate(loginSchema), async (req, res) => {
  try {
    const rawEmail = req.body.username || req.body.email || "";
    const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
    const password = req.body.password;

    if (!email) {
      res.status(400).json({ detail: "Email is required" });
      return;
    }

    const user = await User.findOne({ email });

    if (!user) {
      res.status(401).json({ detail: "Incorrect email or password" });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ detail: "Incorrect email or password" });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ detail: "Account is inactive" });
      return;
    }

    const token = generateToken(user.numericId);

    res.json({
      access_token: token,
      token_type: "bearer",
      user: user.toJSON(),
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(10, "Password must be at least 10 characters")
      .regex(/[A-Z]/, "Must contain uppercase")
      .regex(/[a-z]/, "Must contain lowercase")
      .regex(/[0-9]/, "Must contain number")
      .regex(/[^A-Za-z0-9]/, "Must contain special character"),
    full_name: z.string().min(1, "Full name is required").trim(),
    role: z.enum(["CUSTOMER", "VENDOR"]).optional()
  })
});

// POST /api/v1/auth/register
router.post("/register", authLimiter, validate(registerSchema), async (req, res) => {
  try {
    const { email, password, full_name, role } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res
        .status(400)
        .json({ detail: "An account with this email already exists" });
      return;
    }

    const lastUser = await User.findOne().sort({ numericId: -1 });
    const numericId = (lastUser?.numericId || 0) + 1;
    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      numericId,
      email: normalizedEmail,
      fullName: String(full_name).trim(),
      passwordHash,
      walletBalance: 350,
      loyaltyTier: "BRONZE",
      stars: 0,
      role: role === "VENDOR" ? "VENDOR" : "CUSTOMER",
      isActive: true,
    });

    await user.save();

    const token = generateToken(user.numericId);

    res.status(201).json({
      access_token: token,
      token_type: "bearer",
      user: user.toJSON(),
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// POST /api/v1/auth/sync (Sync Clerk/Google users into MongoDB)
router.post("/sync", async (req, res) => {
  try {
    const { email, full_name } = req.body;
    if (!email) {
      res.status(400).json({ detail: "Email is required for synchronization" });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      const count = await User.countDocuments();
      const numericId = count + 1;
      const passwordHash = await bcrypt.hash("clerk_oauth_user_secret", 10);

      user = new User({
        numericId,
        email: normalizedEmail,
        fullName: (full_name || email.split("@")[0]).trim(),
        passwordHash,
        walletBalance: 350,
        loyaltyTier: "BRONZE",
        stars: 0,
      });

      await user.save();
    }

    const token = generateToken(user.numericId);

    res.json({
      access_token: token,
      token_type: "bearer",
      user: user.toJSON(),
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

import { syncUserWalletBalance } from "../utils/walletHelper.js";

// GET /api/v1/auth/me
router.get("/me", authenticate, async (req, res) => {
  if (req.user) {
    await syncUserWalletBalance(req.user._id);
  }
  res.json(req.user?.toJSON());
});

// PUT /api/v1/auth/vendor/password
router.put("/vendor/password", authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res
        .status(400)
        .json({ detail: "Current password and new password are required" });
      return;
    }
    if (!req.user) {
      res.status(401).json({ detail: "Not authenticated" });
      return;
    }
    const isMatch = await req.user.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(400).json({ detail: "Incorrect current password" });
      return;
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    req.user.passwordHash = passwordHash;
    await req.user.save();
    res.json({ detail: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

import { Vendor } from "../models/Vendor.js";

const vendorRegisterSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(10, "Password must be at least 10 characters")
      .regex(/[A-Z]/, "Must contain uppercase")
      .regex(/[a-z]/, "Must contain lowercase")
      .regex(/[0-9]/, "Must contain number")
      .regex(/[^A-Za-z0-9]/, "Must contain special character"),
    full_name: z.string().min(1).trim(),
    storeName: z.string().min(1).trim(),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    gst: z.string().optional(),
    description: z.string().optional()
  })
});

// POST /api/v1/auth/vendor/register
router.post("/vendor/register", authLimiter, validate(vendorRegisterSchema), async (req, res) => {
  try {
    const { email, password, full_name, storeName, phone, address, city, state, pincode, gst, description } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(400).json({ detail: "An account with this email already exists" });
      return;
    }

    const lastUser = await User.findOne().sort({ numericId: -1 });
    const numericId = (lastUser?.numericId || 0) + 1;
    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      numericId,
      email: normalizedEmail,
      fullName: String(full_name).trim(),
      passwordHash,
      walletBalance: 0,
      loyaltyTier: "BRONZE",
      stars: 0,
      role: "VENDOR",
      isActive: true,
    });
    await user.save();

    const count = await Vendor.countDocuments();
    const vendorNumericId = count + 5000;
    const vendorId = `TRY-VND-${vendorNumericId.toString().padStart(6, '0')}`;
    const vendor = new Vendor({
      numericId: vendorNumericId,
      vendorId,
      user: user._id,
      storeName,
      description,
      email: normalizedEmail,
      phone,
      address: `${address || ''}, ${city || ''}, ${state || ''}, ${pincode || ''}`.replace(/^[,\s]+|[,\s]+$/g, ''),
      gst,
      status: "APPROVED",
      statusHistory: [
        {
          status: "APPROVED",
          changedAt: new Date(),
          reason: "Direct Vendor Registration",
        },
      ],
    });
    await vendor.save();

    const token = generateToken(user.numericId);

    res.status(201).json({
      access_token: token,
      token_type: "bearer",
      user: user.toJSON(),
      vendor: vendor.toJSON(),
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ detail: "Store name already exists." });
      return;
    }
    res.status(500).json({ detail: error.message });
  }
});

export default router;
