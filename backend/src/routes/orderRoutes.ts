import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Order, IOrderItem } from '../models/Order';
import { Product } from '../models/Product';
import { WalletCredit } from '../models/WalletCredit';
import { WalletRule } from '../models/WalletRule';
import { User } from '../models/User';
import { SystemConfig } from '../models/SystemConfig';
import { Category } from '../models/Category';
import { Brand } from '../models/Brand';

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
    const uniqueVendors = new Set<string>();
    
    // Fetch global commission rate
    const systemConfig = await SystemConfig.findOne() || { platformCommissionRate: 0.15 };
    const commissionRate = systemConfig.platformCommissionRate;

    for (const item of items) {
      let productDoc: any;
      if (!isNaN(Number(item.product_id))) {
        productDoc = await Product.findOne({ numericId: Number(item.product_id) });
      } else if (mongoose.Types.ObjectId.isValid(item.product_id)) {
        productDoc = await Product.findById(item.product_id);
      }

      if (!productDoc) {
        res.status(404).json({ detail: `Product not found: ${item.product_id}` });
        return;
      }

      const itemType = item.item_type === 'full' ? 'full' : 'tester';
      const unitPrice = itemType === 'full' ? productDoc.fullPrice : productDoc.testerPrice;
      const qty = item.quantity || 1;
      const totalPrice = unitPrice * qty;
      
      if (itemType === 'full' && productDoc.stockFull < qty) {
        res.status(400).json({ detail: `Insufficient stock for full size of ${productDoc.name}` });
        return;
      }
      if (itemType === 'tester' && productDoc.stockTester < qty) {
        res.status(400).json({ detail: `Insufficient stock for tester of ${productDoc.name}` });
        return;
      }

      const itemPlatformFee = totalPrice * commissionRate;
      const vendorEarnings = totalPrice - itemPlatformFee;

      subtotal += totalPrice;

      if (productDoc.vendor) {
        uniqueVendors.add(productDoc.vendor.toString());
      }

      orderItems.push({
        product: productDoc._id,
        itemType,
        quantity: qty,
        unitPrice,
        totalPrice,
        platformFee: itemPlatformFee,
        vendorEarnings: vendorEarnings
      });

      if (itemType === 'tester') {
        testerProductIds.push(productDoc._id);
      }
    }

    let walletDiscount = 0;
    let platformFee = 0;
    let totalAmount = subtotal;
    let credit: any = null;

    // Process Wallet Credit Redemption safely without Mongoose CastError
    if (apply_wallet_credit_id) {
      let creditQuery: any = { user: user._id, status: 'ACTIVE' };
      if (!isNaN(Number(apply_wallet_credit_id))) {
        creditQuery.$or = [
          { numericId: Number(apply_wallet_credit_id) }
        ];
        if (mongoose.Types.ObjectId.isValid(apply_wallet_credit_id)) {
          creditQuery.$or.push({ _id: apply_wallet_credit_id });
        }
      } else if (mongoose.Types.ObjectId.isValid(apply_wallet_credit_id)) {
        creditQuery._id = apply_wallet_credit_id;
      } else {
        res.status(400).json({ detail: 'Invalid apply_wallet_credit_id' });
        return;
      }

      credit = await WalletCredit.findOne(creditQuery);

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
    const shippingAddress = req.body.shipping_address || req.body.shippingAddress || undefined;

    const paymentMethod = req.body.payment_method || req.body.paymentMethod || '';
    const isCod = paymentMethod.toLowerCase().includes('cash') || paymentMethod.toLowerCase().includes('cod');
    const orderStatus = isCod ? 'PENDING' : 'PAID';

    const vendorStatuses = Array.from(uniqueVendors).map(vId => ({
      vendor: new mongoose.Types.ObjectId(vId),
      status: orderStatus,
      history: [{ status: orderStatus, changedAt: new Date() }]
    }));

    const order = new Order({
      numericId,
      user: user._id,
      items: orderItems,
      subtotal,
      walletDiscount,
      platformFee,
      totalAmount,
      status: orderStatus,
      paymentMethod: paymentMethod || (isCod ? 'Cash on Delivery' : 'Tryvia Pay'),
      appliedCreditId: credit ? credit.numericId : apply_wallet_credit_id,
      shippingAddress,
      vendorStatuses
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
      
      // Deduct inventory
      if (item.itemType === 'full') {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stockFull: -item.quantity }
        });
      } else {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stockTester: -item.quantity }
        });
      }
    }

    // Populate order items product & brand
    const populatedOrder = await Order.findById(order._id).populate({
      path: 'items.product',
      populate: { path: 'brand' },
    });

    const responseJSON: any = populatedOrder?.toJSON() || order.toJSON();
    if (responseJSON.items && Array.isArray(responseJSON.items)) {
      responseJSON.items = responseJSON.items.map((i: any) => ({
        product_id: i.product?.numericId || i.product?._id || i.product,
        product_name: i.product?.name || 'Luxury Formulation',
        product_image_url: i.product?.imageUrl || '',
        product_brand: i.product?.brand?.name || 'TRYVIA',
        item_type: i.itemType,
        quantity: i.quantity,
        unit_price: i.unitPrice,
        total_price: i.totalPrice,
      }));
    }

    res.json(responseJSON);
  } catch (error: any) {
    console.error('Order creation error in backend:', error);
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

    const result = orders.map(order => {
      const json: any = order.toJSON();
      json.items = (json.items || []).map((i: any) => ({
        product_id: i.product?.numericId || i.product?._id || i.product,
        product_name: i.product?.name || 'Luxury Formulation',
        product_image_url: i.product?.imageUrl || '',
        product_brand: i.product?.brand?.name || 'TRYVIA',
        item_type: i.itemType,
        quantity: i.quantity,
        unit_price: i.unitPrice,
        total_price: i.totalPrice,
      }));
      return json;
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ detail: error.message });
  }
});

// GET /api/v1/orders/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const idParam = typeof req.params.id === 'string' ? req.params.id : String(req.params.id || '');

    let query: any = { user: user._id };
    if (!isNaN(Number(idParam))) {
      query.numericId = Number(idParam);
    } else if (mongoose.Types.ObjectId.isValid(idParam)) {
      query._id = idParam;
    } else {
      res.status(404).json({ detail: 'Order not found' });
      return;
    }

    const order = await Order.findOne(query).populate({
      path: 'items.product',
      populate: { path: 'brand' },
    });

    if (!order) {
      res.status(404).json({ detail: 'Order not found' });
      return;
    }

    const responseJSON: any = order.toJSON();
    responseJSON.items = (responseJSON.items || []).map((i: any) => ({
      product_id: i.product?.numericId || i.product?._id || i.product,
      product_name: i.product?.name || 'Luxury Formulation',
      product_image_url: i.product?.imageUrl || '',
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

export default router;
