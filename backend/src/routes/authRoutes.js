import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

const generateToken = (numericId) => {
  const secret =
    process.env.JWT_SECRET || "tryvia_secret_jwt_key_super_secure_2026";
  return jwt.sign({ sub: numericId }, secret, { expiresIn: "7d" });
};

// POST /api/v1/auth/login
router.post("/login", async (req, res) => {
  try {
    const rawEmail = req.body.username || req.body.email || "";
    const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";

    if (!email || !password) {
      res.status(400).json({ detail: "Email and password are required" });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ detail: "Invalid email format" });
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

// POST /api/v1/auth/register
router.post("/register", async (req, res) => {
  try {
    const { email, password, full_name, role } = req.body;

    if (!email || !password || !full_name) {
      res
        .status(400)
        .json({ detail: "Email, password, and full name are required" });
      return;
    }

    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      res.status(400).json({ detail: "Invalid email format" });
      return;
    }

    if (typeof password !== "string" || password.length < 6) {
      res
        .status(400)
        .json({ detail: "Password must be at least 6 characters long" });
      return;
    }

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

export default router;
