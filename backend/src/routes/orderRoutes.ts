import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Order, IOrderItem } from '../models/Order';
import { Product } from '../models/Product';
import { WalletCredit } from '../models/WalletCredit';
import { WalletRule } from '../models/WalletRule';
import { User } from '../models/User';

const router = Router();

// POST /api/v1/orders/
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { items, apply_wallet_credit_id } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ detail: 'Order must contain items' });
      return;
    }

    let subtotal = 0;
    const orderItems: IOrderItem[] = [];
    const testerProductIds: mongoose.Types.ObjectId[] = [];

    for (const item of items) {
      let productDoc: any;
      if (!isNaN(Number(item.product_id))) {
        productDoc = await Product.findOne({ numericId: Number(item.product_id) });
      } else if (mongoose.Types.ObjectId.isValid(item.product_id)) {
        productDoc = await Product.findById(item.product_id);
      }

      if (!productDoc) {
        res.status(400).json({ detail: `Product ${item.product_id} not found` });
        return;
      }

      const itemType = item.item_type === 'full' ? 'full' : 'tester';
      const unitPrice = itemType === 'full' ? productDoc.fullPrice : productDoc.testerPrice;
      const totalPrice = unitPrice * (item.quantity || 1);

      subtotal += totalPrice;

      orderItems.push({
        product: productDoc._id,
        itemType,
        quantity: item.quantity || 1,
        unitPrice,
        totalPrice,
      });

      if (itemType === 'tester') {
        testerProductIds.push(productDoc._id);
      }
    }

    let walletDiscount = 0;
    let platformFee = 0;
    let totalAmount = subtotal;

    // Process Wallet Credit Redemption
    if (apply_wallet_credit_id) {
      const credit = await WalletCredit.findOne({
        user: user._id,
        $or: [{ numericId: apply_wallet_credit_id }, { _id: apply_wallet_credit_id }],
        status: 'ACTIVE',
      });

      if (credit) {
        walletDiscount = credit.redeemableAmount;
        platformFee = credit.platformFee;
        totalAmount = Math.max(0, subtotal - walletDiscount);

        credit.status = 'USED';
        await credit.save();
      }
    }

    const orderCount = await Order.countDocuments();
    const numericId = 8920 + orderCount + 1;

    const order = new Order({
      numericId,
      user: user._id,
      items: orderItems,
      subtotal,
      walletDiscount,
      platformFee,
      totalAmount,
      status: 'PAID',
      appliedCreditId: apply_wallet_credit_id,
    });

    await order.save();

    // If customer purchased testers, grant 90% smart upgrade credit for each tester!
    const rule = await WalletRule.findOne({ isActive: true }) || {
      redeemPercentage: 0.9,
      platformFeePercentage: 0.1,
      expiryDays: 30,
    };

    const creditCount = await WalletCredit.countDocuments();
    let currentCreditIndex = creditCount;

    for (const item of orderItems) {
      if (item.itemType === 'tester') {
        currentCreditIndex += 1;
        const originalAmount = item.totalPrice;
        const redeemableAmount = Math.round(originalAmount * rule.redeemPercentage);
        const fee = Math.round(originalAmount * rule.platformFeePercentage);

        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + rule.expiryDays);

        const newCredit = new WalletCredit({
          numericId: currentCreditIndex,
          user: user._id,
          eligibleProduct: item.product,
          originalAmount,
          redeemableAmount,
          platformFee: fee,
          status: 'ACTIVE',
          expiryDate,
        });

        await newCredit.save();

        // Update user's wallet balance
        await User.findByIdAndUpdate(user._id, {
          $inc: { walletBalance: redeemableAmount },
        });
      }
    }

    // Populate order items product & brand
    const populatedOrder = await Order.findById(order._id).populate({
      path: 'items.product',
      populate: { path: 'brand' },
    });

    const responseJSON: any = populatedOrder?.toJSON();
    responseJSON.items = responseJSON.items.map((i: any) => ({
      product_id: i.product?.numericId || i.product?._id,
      product_name: i.product?.name,
      product_image_url: i.product?.imageUrl,
      product_brand: i.product?.brand?.name || 'TRYVIA',
      item_type: i.itemType,
      quantity: i.quantity,
      unit_price: i.unitPrice,
      total_price: i.totalPrice,
    }));

    res.json(responseJSON);
  } catch (error: any) {
    res.status(500).json({ detail: error.message });
  }
});

// GET /api/v1/orders/
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const orders = await Order.find({ user: user._id })
      .populate({
        path: 'items.product',
        populate: { path: 'brand' },
      })
      .sort({ createdAt: -1 });

    const formattedOrders = orders.map((order) => {
      const orderJSON: any = order.toJSON();
      orderJSON.items = order.items.map((i: any) => ({
        product_id: i.product?.numericId || i.product?._id,
        product_name: i.product?.name || 'Luxury Formulation',
        product_image_url: i.product?.imageUrl,
        product_brand: i.product?.brand?.name || 'TRYVIA',
        item_type: i.itemType,
        quantity: i.quantity,
        unit_price: i.unitPrice,
        total_price: i.totalPrice,
      }));
      return orderJSON;
    });

    res.json(formattedOrders);
  } catch (error: any) {
    res.status(500).json({ detail: error.message });
  }
});

export default router;
