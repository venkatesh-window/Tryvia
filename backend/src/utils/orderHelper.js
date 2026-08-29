import mongoose from "mongoose";
import { Order } from "../models/Order.js";
import { User } from "../models/User.js";
import { Product } from "../models/Product.js";
import { WalletTransaction } from "../models/WalletTransaction.js";
import { WalletCredit } from "../models/WalletCredit.js";
import { syncUserWalletBalance } from "./walletHelper.js";

async function fulfillOrderInternal(order, session) {
  const user = await User.findById(order.user).session(session);
  if (!user) throw new Error("User not found");

  const walletUsed = order.walletUsed || 0;

  // 1. Process Debits (Wallet usage)
  if (walletUsed > 0) {
    if (user.walletBalance < walletUsed) {
      throw new Error("Insufficient wallet balance for this order");
    }

    user.walletBalance -= walletUsed;

    // Deduct from credit lots, earliest expiring first
    let remainingToDeduct = walletUsed;
    const activeCredits = await WalletCredit.find({
      user: user._id,
      status: { $in: ["ACTIVE", "PARTIALLY_USED"] },
      expiryDate: { $gt: new Date() }
    })
    .sort({ expiryDate: 1 })
    .session(session);

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
    const txCount = await WalletTransaction.countDocuments().session(session);
    await WalletTransaction.create(
      [
        {
          numericId: txCount + 1,
          user: user._id,
          type: "DEBIT",
          source: "ORIGINAL_PRODUCT_PURCHASE",
          amount: walletUsed,
          order: order._id,
          description: `Credits used for original product purchase of order #${order.numericId}`,
        },
      ],
      { session }
    );
  }

  // 2. Process Credits (Mini product purchase)
  for (const item of order.items) {
    if (item.itemType === "tester") {
      const earned = item.totalPrice;
      user.walletBalance += earned;

      // Create WalletCredit lot (with 30 days expiration)
      const creditCount = await WalletCredit.countDocuments().session(session);
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30); // 30 days expiration

      await WalletCredit.create(
        [
          {
            numericId: creditCount + 1,
            user: user._id,
            eligibleProduct: item.product,
            originalAmount: earned,
            redeemableAmount: earned,
            platformFee: 0,
            status: "ACTIVE",
            expiryDate,
          }
        ],
        { session }
      );

      const txCount = await WalletTransaction.countDocuments().session(session);
      await WalletTransaction.create(
        [
          {
            numericId: txCount + 1,
            user: user._id,
            type: "CREDIT",
            source: "MINI_PRODUCT_PURCHASE",
            amount: earned,
            order: order._id,
            description: `Credits earned from mini product purchase of order #${order.numericId}`,
          },
        ],
        { session }
      );
    }

    // Decrement stock
    if (item.itemType === "full") {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stockFull: -item.quantity } },
        { session }
      );
    } else {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stockTester: -item.quantity } },
        { session }
      );
    }
  }

  order.walletBalanceBefore = order.walletBalanceBefore || user.walletBalance + walletUsed - (order.items.reduce((acc, i) => acc + (i.itemType === "tester" ? i.totalPrice : 0), 0));
  order.status = "PAID";
  
  await user.save({ session });
  await order.save({ session });

  // Sync wallet balance to clear PENDING reservation and update final accurate balance
  order.walletBalanceAfter = await syncUserWalletBalance(user._id, session);
  await order.save({ session });

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
