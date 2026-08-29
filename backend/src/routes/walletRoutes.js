import { Router } from "express";
import mongoose from "mongoose";
import { authenticate } from "../middleware/auth.js";
import { WalletRule } from "../models/WalletRule.js";
import { WalletCredit } from "../models/WalletCredit.js";
import { Product } from "../models/Product.js";
import { WalletTransaction } from "../models/WalletTransaction.js";
import { syncUserWalletBalance } from "../utils/walletHelper.js";

const router = Router();

// GET /api/v1/wallet/rules
router.get("/rules", async (req, res) => {
  try {
    let rule = await WalletRule.findOne({ isActive: true });
    if (!rule) {
      rule = new WalletRule({
        minTesterPurchase: 200,
        redeemPercentage: 0.9,
        platformFeePercentage: 0.1,
        expiryDays: 30,
        isActive: true,
      });
      await rule.save();
    }

    res.json(rule.toJSON());
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// GET /api/v1/wallet/balance
router.get("/balance", authenticate, async (req, res) => {
  try {
    const user = req.user;
    const now = new Date();

    // Synchronize the wallet balance efficiently
    const validWalletBalance = await syncUserWalletBalance(user._id);

    // Fetch transactions
    const transactions = await WalletTransaction.find({ user: user._id })
      .sort({ createdAt: -1 })
      .populate("order");

    // Fetch credits
    const credits = await WalletCredit.find({ user: user._id })
      .sort({ expiryDate: 1 }) // sort by earliest expiring first
      .populate("eligibleProduct");

    const active_credits = [];
    const used_credits = [];
    const expired_credits = [];

    for (const c of credits) {
      const json = c.toJSON();
      if (c.status === "USED") {
        used_credits.push(json);
      } else if (c.status === "EXPIRED" || c.expiryDate <= now) {
        expired_credits.push(json);
      } else {
        active_credits.push(json);
      }
    }

    res.json({
      total_balance: validWalletBalance,
      transactions: transactions.map((t) => t.toJSON()),
      active_credits,
      used_credits,
      expired_credits,
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// GET /api/v1/wallet/transactions
router.get("/transactions", authenticate, async (req, res) => {
  try {
    const user = req.user;
    const transactions = await WalletTransaction.find({ user: user._id })
      .sort({ createdAt: -1 })
      .populate("order");
    res.json(transactions.map((t) => t.toJSON()));
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// GET /api/v1/wallet/eligibility/:productId
router.get("/eligibility/:productId", authenticate, async (req, res) => {
  try {
    const user = req.user;
    const productIdParam =
      typeof req.params.productId === "string" ? req.params.productId : "";
    let targetProductId;

    if (!isNaN(Number(productIdParam))) {
      const prod = await Product.findOne({ numericId: Number(productIdParam) });
      targetProductId = prod?._id;
    } else if (mongoose.Types.ObjectId.isValid(productIdParam)) {
      targetProductId = productIdParam;
    }

    if (!targetProductId) {
      res.json({ eligible: false, credit: null });
      return;
    }

    const now = new Date();
    const credit = await WalletCredit.findOne({
      user: user._id,
      eligibleProduct: targetProductId,
      status: { $in: ["ACTIVE", "PARTIALLY_USED"] },
      redeemableAmount: { $gt: 0 },
      expiryDate: { $gt: now },
    });

    if (!credit) {
      res.json({ eligible: false, credit: null });
      return;
    }

    res.json({
      eligible: true,
      credit: credit.toJSON(),
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

export default router;
