import mongoose from "mongoose";
import { WalletCredit } from "../models/WalletCredit.js";
import { Order } from "../models/Order.js";
import { User } from "../models/User.js";

/**
 * Synchronizes the user's authoritative wallet balance and handles expirations.
 * This should be called whenever the balance is requested or modified.
 * 
 * @param {string|mongoose.Types.ObjectId} userId 
 * @param {mongoose.ClientSession} session Optional session for transactions
 * @returns {Promise<number>} The synced valid wallet balance
 */
export async function syncUserWalletBalance(userId, session = null) {
  const now = new Date();

  // 1. Expire credits that have passed their expiryDate
  const expireCondition = {
    user: userId,
    status: { $in: ["ACTIVE", "PARTIALLY_USED"] },
    expiryDate: { $lte: now }
  };
  
  if (session) {
    await WalletCredit.updateMany(expireCondition, { $set: { status: "EXPIRED" } }, { session });
  } else {
    await WalletCredit.updateMany(expireCondition, { $set: { status: "EXPIRED" } });
  }

  // 2. Sum remaining valid credits
  const validCredits = await WalletCredit.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        status: { $in: ["ACTIVE", "PARTIALLY_USED"] },
        expiryDate: { $gt: now }
      }
    },
    {
      $group: {
        _id: null,
        totalRedeemable: { $sum: "$redeemableAmount" }
      }
    }
  ]).session(session || null);

  const totalRedeemable = validCredits.length > 0 ? validCredits[0].totalRedeemable : 0;

  // 3. Find reserved wallet amounts in PENDING orders (last 15 minutes)
  const fifteenMinsAgo = new Date(now.getTime() - 15 * 60000);
  const pendingOrders = await Order.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        status: "PENDING",
        createdAt: { $gt: fifteenMinsAgo },
        walletUsed: { $gt: 0 }
      }
    },
    {
      $group: {
        _id: null,
        totalReserved: { $sum: "$walletUsed" }
      }
    }
  ]).session(session || null);

  const reservedAmount = pendingOrders.length > 0 ? pendingOrders[0].totalReserved : 0;

  // 4. Calculate authoritative balance
  const authoritativeBalance = Math.max(0, totalRedeemable - reservedAmount);

  // 5. Update user model cache
  if (session) {
    await User.updateOne({ _id: userId }, { $set: { walletBalance: authoritativeBalance } }, { session });
  } else {
    await User.updateOne({ _id: userId }, { $set: { walletBalance: authoritativeBalance } });
  }

  return authoritativeBalance;
}
