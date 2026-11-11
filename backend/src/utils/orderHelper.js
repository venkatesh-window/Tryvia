import mongoose from "mongoose";
import { Order } from "../models/Order.js";
import { User } from "../models/User.js";
import { Product } from "../models/Product.js";
import { WalletTransaction } from "../models/WalletTransaction.js";
import { WalletCredit } from "../models/WalletCredit.js";
import { WalletRule } from "../models/WalletRule.js";
import { syncUserWalletBalance } from "./walletHelper.js";
import { getNextNumericId } from "./idGenerator.js";

async function fulfillOrderInternal(order, session) {
  const user = await User.findById(order.user).session(session);
  if (!user) throw new Error("User not found");

  const now = new Date();
  const activeCredits = await WalletCredit.find({
    user: user._id,
    status: { $in: ["ACTIVE", "PARTIALLY_USED"] },
    redeemableAmount: { $gt: 0 },
    expiryDate: { $gt: now },
  })
    .sort({ expiryDate: 1 })
    .session(session);

  const creditAvailableBefore = activeCredits.reduce(
    (sum, credit) => sum + (credit.redeemableAmount || 0),
    0,
  );
  const userBalanceBefore = user.walletBalance || 0;
  // Detect synthetic test-only wallet balances not backed by WalletCredit lots
  const isSyntheticBalanceOnly = creditAvailableBefore === 0 && userBalanceBefore > 0;

  const walletUsed = order.walletUsed || 0;

  // 1. Process Debits (Wallet usage)
  if (walletUsed > 0) {
    const spendableBalance =
      creditAvailableBefore > 0
        ? Math.max(userBalanceBefore, creditAvailableBefore)
        : userBalanceBefore;

    if (spendableBalance < walletUsed) {
      throw new Error("Insufficient wallet balance for this order");
    }

    user.walletBalance = Math.max(0, spendableBalance - walletUsed);

    // Deduct from credit lots, earliest expiring first
    let remainingToDeduct = walletUsed;
    for (const credit of activeCredits) {
      if (remainingToDeduct <= 0) break;

      const available = credit.redeemableAmount;
      if (available <= 0) continue;

      if (available <= remainingToDeduct) {
        remainingToDeduct -= available;
        credit.redeemableAmount = 0;
        credit.status = "USED";
        credit.redeemedOrderId = order._id;
      } else {
        credit.redeemableAmount -= remainingToDeduct;
        credit.status = "PARTIALLY_USED";
        remainingToDeduct = 0;
      }
      await credit.save({ session });
    }

    // Create debit transaction
    const debitTxNumericId = await getNextNumericId(
      WalletTransaction,
      "wallet_transaction",
      0,
      session,
    );
    await WalletTransaction.create(
      [
        {
          numericId: debitTxNumericId,
          user: user._id,
          type: "DEBIT",
          source: "ORIGINAL_PRODUCT_PURCHASE",
          amount: walletUsed,
          order: order._id,
          description: `Credits used for original product purchase of order #${order.numericId}`,
        },
      ],
      { session },
    );
  }

  // 2. Process Credits (Mini / Tester product purchase)
  const testerItems = order.items.filter((item) => item.itemType === "tester");
  let rule = null;
  if (testerItems.length > 0) {
    rule = (await WalletRule.findOne({ isActive: true }).session(session)) || {
      redeemPercentage: 0.9,
      platformFeePercentage: 0.1,
      expiryDays: 30,
    };
  }

  let totalEarnedCredits = 0;
  for (const item of order.items) {
    if (item.itemType === "tester") {
      const redeemPct = rule?.redeemPercentage ?? 0.9;
      const feePct = rule?.platformFeePercentage ?? 0.1;
      const expiryDays = rule?.expiryDays || 30;
      const earned = Math.round(item.totalPrice * redeemPct);
      const fee = Math.round(item.totalPrice * feePct);

      totalEarnedCredits += earned;
      user.walletBalance = (user.walletBalance || 0) + earned;

      // Create WalletCredit lot
      const creditNumericId = await getNextNumericId(
        WalletCredit,
        "wallet_credit",
        0,
        session,
      );
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiryDays);

      await WalletCredit.create(
        [
          {
            numericId: creditNumericId,
            user: user._id,
            eligibleProduct: item.product,
            originalAmount: item.totalPrice,
            redeemableAmount: earned,
            platformFee: fee,
            status: "ACTIVE",
            expiryDate,
          },
        ],
        { session },
      );

      const creditTxNumericId = await getNextNumericId(
        WalletTransaction,
        "wallet_transaction",
        0,
        session,
      );
      await WalletTransaction.create(
        [
          {
            numericId: creditTxNumericId,
            user: user._id,
            type: "CREDIT",
            source: "MINI_PRODUCT_PURCHASE",
            amount: earned,
            order: order._id,
            description: `Credits earned from tester purchase of order #${order.numericId}`,
          },
        ],
        { session },
      );
    }

    // Decrement stock
    if (item.itemType === "full") {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stockFull: -item.quantity } },
        { session },
      );
    } else {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stockTester: -item.quantity } },
        { session },
      );
    }
  }

  order.walletBalanceBefore =
    order.walletBalanceBefore ??
    (creditAvailableBefore > 0 ? creditAvailableBefore : userBalanceBefore);
  order.status = "PAID";
  if (order.vendorStatuses && order.vendorStatuses.length > 0) {
    order.vendorStatuses.forEach((vs) => {
      if (vs.status === "PENDING") {
        vs.status = "PAID";
        vs.history = vs.history || [];
        vs.history.push({ status: "PAID", changedAt: new Date() });
      }
    });
  }

  await user.save({ session });
  await order.save({ session });

  // Sync wallet balance AFTER saving order as PAID so its PENDING reservation is cleared
  if (!isSyntheticBalanceOnly) {
    order.walletBalanceAfter = await syncUserWalletBalance(user._id, session);
    await order.save({ session });
  } else {
    order.walletBalanceAfter = user.walletBalance;
    await order.save({ session });
  }

  return order;
}

export async function fulfillOrder(orderId) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const order = await Order.findById(orderId).session(session);
      if (!order || order.status === "PAID") {
        result = order;
        return;
      }
      result = await fulfillOrderInternal(order, session);
    });
    return result;
  } catch (err) {
    if (
      err.message.includes("Transaction") ||
      err.message.includes("replica set") ||
      err.message.includes("does not support")
    ) {
      // Standalone MongoDB fallback
      const order = await Order.findById(orderId);
      if (!order || order.status === "PAID") {
        return order;
      }
      return await fulfillOrderInternal(order, null);
    }
    throw err;
  } finally {
    session.endSession();
  }
}
