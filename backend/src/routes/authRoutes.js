import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { User } from "../models/User.js";
import { authenticate, requireVendor } from "../middleware/auth.js";
import { validate } from "../middleware/validation.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import { getNextNumericId } from "../utils/idGenerator.js";

const router = Router();

const generateToken = (numericId) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured on server");
  }
  return jwt.sign({ sub: numericId }, secret, { expiresIn: "7d" });
};

const loginSchema = z.object({
  body: z.object({
    username: z.string().optional(),
    email: z.string().trim().email().optional(),
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
    email: z.string().trim().email(),
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

    const numericId = await getNextNumericId(User, "user", 0);
    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      numericId,
      email: normalizedEmail,
      fullName: String(full_name).trim(),
      passwordHash,
      walletBalance: 0,
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

const syncSchema = z.object({
  body: z.object({
    email: z.string().trim().email("Valid email required"),
    full_name: z.string().trim().max(100).optional().or(z.literal("")),
    google_access_token: z.string().min(10).max(4096).optional(),
  })
});

// GET /api/v1/auth/google/callback - HTTPS OAuth bounce page for Google Web Client ID -> mobile deep link
router.get("/google/callback", (_req, res) => {
  res.removeHeader("Cross-Origin-Opener-Policy");
  res.removeHeader("Cross-Origin-Embedder-Policy");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline';"
  );
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>TryVia Google Sign-In</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #FAF8F5; color: #1A1918; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; text-align: center; }
    .card { background: #FFFFFF; border: 1px solid #ECE7E1; border-radius: 20px; padding: 28px; max-width: 360px; width: 100%; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
    .title { font-size: 20px; font-weight: 700; letter-spacing: 1px; margin-bottom: 8px; }
    .msg { font-size: 14px; color: #6E6A65; margin-bottom: 20px; }
    .btn { display: inline-block; background: #1A1918; color: #FFFFFF; text-decoration: none; padding: 14px 24px; border-radius: 999px; font-size: 14px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <div class="title">TRYVIA</div>
    <div id="msg" class="msg">Completing Google Sign-In, returning to TryVia...</div>
    <a id="return-btn" class="btn" href="tryvia://oauth-native-callback" style="display:none;">Return to TryVia</a>
  </div>
  <script>
    (function () {
      var hashStr = (window.location.hash || "").replace(/^#/, "");
      var queryStr = (window.location.search || "").replace(/^\\?/, "");
      var hashParams = new URLSearchParams(hashStr);
      var queryParams = new URLSearchParams(queryStr);
      var rawState = hashParams.get("state") || queryParams.get("state") || "";
      var candidate = "";
      try { candidate = decodeURIComponent(rawState); } catch (e) { candidate = rawState; }
      var allowed = ["tryvia://", "mobile://", "exp://", "exp+mobile://", "http://localhost", "http://127.0.0.1", "https://tryvia"];
      var isAllowed = false;
      for (var i = 0; i < allowed.length; i++) {
        if (candidate.toLowerCase().indexOf(allowed[i]) === 0 && candidate.indexOf("<") === -1 && candidate.indexOf(">") === -1) {
          isAllowed = true;
          break;
        }
      }
      var baseTarget = isAllowed ? candidate : "tryvia://oauth-native-callback";
      var accessToken = hashParams.get("access_token") || queryParams.get("access_token");
      var oauthErr = hashParams.get("error") || queryParams.get("error");
      var fragParts = [];
      if (accessToken) fragParts.push("access_token=" + encodeURIComponent(accessToken));
      if (oauthErr) fragParts.push("error=" + encodeURIComponent(oauthErr));
      var finalUrl = baseTarget + (fragParts.length ? "#" + fragParts.join("&") : "");
      var btn = document.getElementById("return-btn");
      if (btn) {
        btn.href = finalUrl;
        btn.style.display = "inline-block";
      }
      try { window.location.replace(finalUrl); } catch (e) {}
    })();
  </script>
</body>
</html>`);
});

// POST /api/v1/auth/sync (Sync Google OAuth users into MongoDB)
router.post("/sync", authLimiter, validate(syncSchema), async (req, res) => {
  try {
    const { email, full_name, google_access_token } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    if (google_access_token) {
      const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${google_access_token}` },
        signal: AbortSignal.timeout(8000),
      });
      if (!profileRes.ok) {
        res.status(401).json({ detail: "Invalid or expired Google OAuth token." });
        return;
      }
      const googleUser = await profileRes.json();
      const verifiedEmail = String(googleUser?.email || "").trim().toLowerCase();
      if (!verifiedEmail || verifiedEmail !== normalizedEmail) {
        res.status(401).json({ detail: "Google token email does not match." });
        return;
      }
    }

    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      // Disallow taking over privileged or staff accounts through unverified OAuth sync
      if (user.role === "ADMIN" || user.role === "VENDOR" || user.isSuperuser) {
        res.status(403).json({
          detail: "Privileged accounts cannot be accessed via OAuth sync. Use direct credentials login.",
        });
        return;
      }

      if (!user.isActive) {
        res.status(403).json({ detail: "Account is inactive" });
        return;
      }
    } else {
      // Create new customer account with random salt/hash (never static secret)
      const numericId = await getNextNumericId(User, "user", 0);
      const randomSecret = (await import("crypto")).randomBytes(32).toString("hex");
      const passwordHash = await bcrypt.hash(randomSecret, 10);

      user = new User({
        numericId,
        email: normalizedEmail,
        fullName: (full_name || email.split("@")[0]).trim(),
        passwordHash,
        walletBalance: 0,
        loyaltyTier: "BRONZE",
        stars: 0,
        role: "CUSTOMER",
        isActive: true,
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
    res.status(500).json({ detail: "Authentication sync failed" });
  }
});

import { syncUserWalletBalance } from "../utils/walletHelper.js";

// GET /api/v1/auth/me
router.get("/me", authenticate, async (req, res) => {
  if (req.user) {
    req.user.walletBalance = await syncUserWalletBalance(req.user._id);
  }
  res.json(req.user?.toJSON());
});

// PUT /api/v1/auth/vendor/password
router.put("/vendor/password", authenticate, requireVendor, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res
        .status(400)
        .json({ detail: "Current password and new password are required" });
      return;
    }
    if (String(newPassword).length < 8) {
      res
        .status(400)
        .json({ detail: "New password must be at least 8 characters long" });
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

import crypto from "crypto";
import { Vendor } from "../models/Vendor.js";
import { Product } from "../models/Product.js";
import { Notification } from "../models/Notification.js";
import { WalletCredit } from "../models/WalletCredit.js";
import { clearProductCache } from "./productRoutes.js";
import { clearStorefrontCatalogCache } from "./storefrontRoutes.js";

const vendorRegisterSchema = z.object({
  body: z.object({
    email: z.string().trim().email(),
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

    const numericId = await getNextNumericId(User, "user", 0);
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

    const vendorNumericId = await getNextNumericId(Vendor, "vendor", 5000);
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
      status: "PENDING",
      statusHistory: [
        {
          status: "PENDING",
          changedAt: new Date(),
          reason: "Vendor Self-Registration Application",
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

async function handleSelfAccountDeletion(req, res) {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ detail: "Not authenticated" });
      return;
    }

    if (user.role === "ADMIN" || user.isSuperuser) {
      res.status(403).json({
        detail: "Admin accounts cannot be deleted from mobile self-service.",
      });
      return;
    }

    const deletionTag = `deleted_${user.numericId || user._id}_${Date.now()}`;
    const randomPass = crypto.randomBytes(32).toString("hex");
    const randomHash = await bcrypt.hash(randomPass, 10);

    // Clear active notifications & unredeemed wallet credits for the deleted user
    await Promise.all([
      Notification.deleteMany({ user: user._id }),
      WalletCredit.updateMany(
        { user: user._id, status: { $in: ["ACTIVE", "PARTIALLY_USED"] } },
        { $set: { status: "EXPIRED", redeemableAmount: 0 } },
      ),
    ]);

    // Suspend vendor profile and deactivate store products if the user is a vendor
    const vendorProfiles = await Vendor.find({ user: user._id });
    if (vendorProfiles.length > 0) {
      const vendorIds = vendorProfiles.map((v) => v._id);
      await Product.updateMany(
        { vendor: { $in: vendorIds } },
        { $set: { status: "INACTIVE" } },
      );
      await Vendor.updateMany(
        { user: user._id },
        {
          $set: {
            status: "SUSPENDED",
            email: `${deletionTag}@deleted.tryvia.local`,
            phone: "",
            address: "",
          },
          $push: {
            statusHistory: {
              status: "SUSPENDED",
              changedBy: user._id,
              reason: "Account deleted by user",
              changedAt: new Date(),
            },
          },
        },
      );
      clearProductCache();
      clearStorefrontCatalogCache();
    }

    // Anonymize personal identifiers & deactivate user while preserving financial order audit trail
    user.email = `${deletionTag}@deleted.tryvia.local`;
    user.fullName = "Deleted User";
    user.passwordHash = randomHash;
    user.walletBalance = 0;
    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      detail: "Your account and personal data have been permanently deleted.",
    });
  } catch (error) {
    console.error("Account deletion error:", error);
    res
      .status(500)
      .json({ detail: error.message || "Failed to delete account" });
  }
}

// DELETE /api/v1/auth/me (and POST /delete-account alias for Play/App Store account deletion)
router.delete("/me", authenticate, handleSelfAccountDeletion);
router.post("/delete-account", authenticate, handleSelfAccountDeletion);

export default router;
