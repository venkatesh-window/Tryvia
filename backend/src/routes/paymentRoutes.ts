import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Order, IOrderItem } from '../models/Order';
import { Product } from '../models/Product';
import { WalletCredit } from '../models/WalletCredit';
import { WalletRule } from '../models/WalletRule';
import { User } from '../models/User';
import {
  razorpayClient,
  RAZORPAY_KEY_ID,
  verifyRazorpaySignature,
  verifyWebhookSignature,
} from '../config/razorpay';

const router = Router();

// Helper to grant tester upgrade credits
async function grantTesterUpgradeCredits(orderItems: IOrderItem[], userId: mongoose.Types.ObjectId) {
  try {
    const rule = (await WalletRule.findOne({ isActive: true })) || {
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
          user: userId,
          eligibleProduct: item.product,
          originalAmount,
          redeemableAmount,
          platformFee: fee,
          status: 'ACTIVE',
          expiryDate,
        });

        await newCredit.save();

        // Update user's wallet balance
        await User.findByIdAndUpdate(userId, {
          $inc: { walletBalance: redeemableAmount },
        });
      }
    }
  } catch (creditErr: any) {
    console.error('Error granting tester upgrade credits:', creditErr?.message || creditErr);
  }
}

// GET /api/v1/payments/config - Returns Razorpay public Key ID
router.get('/config', (_req: Request, res: Response) => {
  res.json({
    key_id: RAZORPAY_KEY_ID,
    currency: 'INR',
  });
});

// POST /api/v1/payments/create-order - Validates cart, calculates authoritative price & creates Razorpay Order
router.post('/create-order', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { items, apply_wallet_credit_id, shipping_address } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ detail: 'Order must contain at least one item' });
      return;
    }

    let subtotal = 0;
    const orderItems: IOrderItem[] = [];

    for (const item of items) {
      if (!item.product_id) {
        res.status(400).json({ detail: 'Every item must have a valid product_id' });
        return;
      }

      const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
      const itemType = item.item_type === 'tester' ? 'tester' : 'full';

      let productDoc: any;
      if (!isNaN(Number(item.product_id))) {
        productDoc = await Product.findOne({ numericId: Number(item.product_id) });
      } else if (mongoose.Types.ObjectId.isValid(item.product_id)) {
        productDoc = await Product.findById(item.product_id);
      }

      if (!productDoc) {
        res.status(400).json({ detail: `Product with ID "${item.product_id}" was not found in catalog.` });
        return;
      }

      // Authoritative unit price from database
      const unitPrice = itemType === 'tester' ? productDoc.testerPrice : productDoc.fullPrice;
      const totalPrice = unitPrice * quantity;

      subtotal += totalPrice;

      orderItems.push({
        product: productDoc._id,
        itemType,
        quantity,
        unitPrice,
        totalPrice,
        platformFee: 0,
        vendorEarnings: 0
      });
    }

    let walletDiscount = 0;
    let platformFee = 0;
    let appliedCredit: any = null;

    if (apply_wallet_credit_id) {
      let creditQuery: any = { user: user._id, status: 'ACTIVE' };
      if (!isNaN(Number(apply_wallet_credit_id))) {
        creditQuery.numericId = Number(apply_wallet_credit_id);
      } else if (mongoose.Types.ObjectId.isValid(apply_wallet_credit_id)) {
        creditQuery._id = apply_wallet_credit_id;
      }

      appliedCredit = await WalletCredit.findOne(creditQuery);
      if (appliedCredit) {
        // Validate expiry
        if (appliedCredit.expiryDate && new Date(appliedCredit.expiryDate) < new Date()) {
          appliedCredit.status = 'EXPIRED';
          await appliedCredit.save();
          appliedCredit = null;
        } else {
          walletDiscount = appliedCredit.redeemableAmount;
          platformFee = appliedCredit.platformFee;
        }
      }
    }

    const totalAmount = Math.max(0, subtotal - walletDiscount);
    const orderCount = await Order.countDocuments();
    const numericId = 8920 + orderCount + 1;

    // Case 1: Order is 100% covered by wallet credit (Zero-value checkout)
    if (totalAmount === 0) {
      const order = new Order({
        numericId,
        user: user._id,
        items: orderItems,
        subtotal,
        walletDiscount,
        platformFee,
        totalAmount: 0,
        status: 'PAID',
        paymentMethod: 'Wallet Credit',
        appliedCreditId: appliedCredit ? appliedCredit._id : undefined,
        shippingAddress: shipping_address || undefined,
        razorpayOrderId: `wallet_paid_${Date.now()}_${numericId}`,
      });

      await order.save();

      // Mark applied credit as USED
      if (appliedCredit) {
        appliedCredit.status = 'USED';
        await appliedCredit.save();
        await User.findByIdAndUpdate(user._id, {
          $inc: { walletBalance: -walletDiscount },
        });
      }

      // Grant tester upgrade credits
      await grantTesterUpgradeCredits(order.items, user._id);

      const populatedOrder = await Order.findById(order._id).populate({
        path: 'items.product',
        populate: { path: 'brand' },
      });

      res.json({
        success: true,
        is_zero_amount: true,
        order_id: numericId,
        order_db_id: order._id,
        order: populatedOrder?.toJSON() || order.toJSON(),
        message: 'Order fully paid with Wallet Credit',
      });
      return;
    }

    // Case 2: Standard Razorpay Gateway Order (amount in paise, minimum 100 paise = ₹1)
    const amountInPaise = Math.round(totalAmount * 100);
    if (!Number.isInteger(amountInPaise) || amountInPaise <= 0) {
      res.status(400).json({ detail: 'Invalid calculated payment amount' });
      return;
    }

    const receipt = `trv_${numericId}_${Date.now().toString().slice(-4)}`;
    let razorpayOrder: any;

    try {
      razorpayOrder = await razorpayClient.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: receipt.slice(0, 40),
        notes: {
          order_numeric_id: numericId.toString(),
          user_id: user._id.toString(),
          user_email: user.email || '',
        },
      });
    } catch (rzpErr: any) {
      console.error('Razorpay order creation failure:', {
        statusCode: rzpErr.statusCode,
        code: rzpErr.error?.code,
        description: rzpErr.error?.description || rzpErr.message,
      });
      res.status(400).json({
        detail: rzpErr.error?.description || rzpErr.message || 'Unable to create Razorpay payment order',
      });
      return;
    }

    // Save preliminary order in PENDING status
    const order = new Order({
      numericId,
      user: user._id,
      items: orderItems,
      subtotal,
      walletDiscount,
      platformFee,
      totalAmount,
      status: 'PENDING',
      paymentMethod: 'Razorpay Online',
      appliedCreditId: appliedCredit ? appliedCredit._id : undefined,
      shippingAddress: shipping_address || undefined,
      razorpayOrderId: razorpayOrder.id,
    });

    await order.save();

    res.json({
      success: true,
      is_zero_amount: false,
      razorpay_order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key_id: RAZORPAY_KEY_ID,
      order_id: numericId,
      order_db_id: order._id,
      customer: {
        name: user.fullName || 'TryVia Member',
        email: user.email || '',
        contact: (user as any).phone || '',
      },
    });
  } catch (error: any) {
    console.error('Payment order creation error:', error);
    res.status(500).json({ detail: error.message || 'Failed to create payment order' });
  }
});

// POST /api/v1/payments/verify - Verifies HMAC-SHA256 payment signature & completes order idempotently
router.post('/verify', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id,
      payment_instrument,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400).json({ detail: 'Missing required Razorpay payment credentials (order ID, payment ID, or signature)' });
      return;
    }

    // Find the order
    let query: any = { user: user._id };
    if (order_id) {
      if (!isNaN(Number(order_id))) {
        query.numericId = Number(order_id);
      } else if (mongoose.Types.ObjectId.isValid(order_id)) {
        query._id = order_id;
      }
    } else {
      query.razorpayOrderId = razorpay_order_id;
    }

    const order = await Order.findOne(query);

    if (!order) {
      res.status(404).json({ detail: 'Order record not found for verification' });
      return;
    }

    // Verify HMAC-SHA256 signature
    const isSignatureValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isSignatureValid) {
      console.warn('Invalid Razorpay signature submitted for order:', order.numericId);
      res.status(400).json({ detail: 'Invalid payment signature. Transaction could not be verified.' });
      return;
    }

    // IDEMPOTENCY CHECK: If order was already marked PAID, return existing order without duplicate deduction
    if (order.status === 'PAID') {
      const populatedOrder = await Order.findById(order._id).populate({
        path: 'items.product',
        populate: { path: 'brand' },
      });

      res.json({
        success: true,
        message: 'Order already verified and paid',
        order: populatedOrder?.toJSON() || order.toJSON(),
      });
      return;
    }

    // Mark order as PAID
    order.status = 'PAID';
    order.paymentMethod = payment_instrument || 'Razorpay Online';
    order.razorpayOrderId = razorpay_order_id;
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;
    await order.save();

    // Mark wallet credit as USED if applied
    if (order.appliedCreditId) {
      let creditQuery: any = { user: user._id, status: 'ACTIVE' };
      if (!isNaN(Number(order.appliedCreditId))) {
        creditQuery.numericId = Number(order.appliedCreditId);
      } else if (mongoose.Types.ObjectId.isValid(order.appliedCreditId)) {
        creditQuery._id = order.appliedCreditId;
      }

      const credit = await WalletCredit.findOne(creditQuery);
      if (credit) {
        credit.status = 'USED';
        await credit.save();
        if (order.walletDiscount > 0) {
          await User.findByIdAndUpdate(user._id, {
            $inc: { walletBalance: -order.walletDiscount },
          });
        }
      }
    }

    // Grant 90% tester upgrade credits for tester items purchased
    await grantTesterUpgradeCredits(order.items, user._id);

    // Populate order details for response
    const populatedOrder = await Order.findById(order._id).populate({
      path: 'items.product',
      populate: { path: 'brand' },
    });

    res.json({
      success: true,
      message: 'Payment verified and order confirmed successfully',
      order: populatedOrder?.toJSON() || order.toJSON(),
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    res.status(500).json({ detail: error.message || 'Payment verification failed' });
  }
});

// GET /api/v1/payments/checkout-session/:orderId - Hosted Live Razorpay Checkout Page for Native Mobile
router.get('/checkout-session/:orderId', async (req: Request, res: Response): Promise<void> => {
  try {
    const orderId = String(req.params.orderId);
    let query: any = {};
    if (!isNaN(Number(orderId))) {
      query.numericId = Number(orderId);
    } else if (mongoose.Types.ObjectId.isValid(orderId)) {
      query._id = orderId;
    } else {
      query.razorpayOrderId = orderId;
    }

    const order = await Order.findOne(query).populate('user');
    if (!order || !order.razorpayOrderId) {
      res.status(404).send('<h3>Order session not found</h3>');
      return;
    }

    const user: any = order.user || {};
    const amountInPaise = Math.round(order.totalAmount * 100);

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>TryVia Secure Checkout</title>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #FAF8F5;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
    }
    .card {
      background: #FFFFFF;
      border: 1px solid #ECE7E1;
      border-radius: 20px;
      padding: 28px;
      text-align: center;
      max-width: 360px;
      width: 100%;
      box-shadow: 0 10px 25px rgba(0,0,0,0.05);
    }
    .title { font-size: 20px; font-weight: 700; color: #1A1918; margin-bottom: 6px; letter-spacing: 1px; }
    .subtitle { font-size: 13px; color: #8E8A85; margin-bottom: 20px; }
    .amount { font-size: 32px; font-weight: 800; color: #1A1918; margin-bottom: 24px; }
    .btn {
      background: #1A1918;
      color: #FFFFFF;
      border: none;
      padding: 16px 24px;
      border-radius: 30px;
      font-size: 15px;
      font-weight: 600;
      width: 100%;
      cursor: pointer;
    }
    .loader {
      border: 3px solid #f3f3f3;
      border-top: 3px solid #1A1918;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      animation: spin 1s linear infinite;
      margin: 20px auto 0;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="card">
    <div class="title">TRYVIA</div>
    <div class="subtitle">HAUTE PARFUMERIE & LUXURY BEAUTY</div>
    <div class="amount">₹${order.totalAmount.toFixed(2)}</div>
    <button id="pay-btn" class="btn" onclick="openRazorpay()">Complete Payment</button>
    <div id="loader" class="loader"></div>
  </div>

  <script>
    function openRazorpay() {
      var options = {
        key: "${RAZORPAY_KEY_ID}",
        amount: "${amountInPaise}",
        currency: "INR",
        name: "TRYVIA",
        description: "Luxury Beauty & Discovery Formulations",
        order_id: "${order.razorpayOrderId}",
        image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=200",
        prefill: {
          name: "${user.fullName || 'TryVia Member'}",
          email: "${user.email || ''}",
          contact: "${user.phone || ''}"
        },
        theme: { color: "#1A1918" },
        handler: function (response) {
          document.getElementById('loader').style.display = 'block';
          var callbackUrl = "tryvia://payment-callback?" +
            "razorpay_order_id=" + encodeURIComponent(response.razorpay_order_id || "${order.razorpayOrderId}") +
            "&razorpay_payment_id=" + encodeURIComponent(response.razorpay_payment_id) +
            "&razorpay_signature=" + encodeURIComponent(response.razorpay_signature) +
            "&order_id=" + encodeURIComponent("${order.numericId}");
          window.location.href = callbackUrl;
        },
        modal: {
          ondismiss: function () {
            window.location.href = "tryvia://payment-callback?status=cancelled&order_id=${order.numericId}";
          }
        }
      };

      var rzp = new Razorpay(options);
      rzp.on('payment.failed', function (response){
        window.location.href = "tryvia://payment-callback?status=failed&error=" + encodeURIComponent(response.error.description || 'Payment Failed');
      });
      rzp.open();
    }

    // Auto-trigger on page load
    window.onload = function() {
      setTimeout(openRazorpay, 300);
    };
  </script>
</body>
</html>
    `;

    res.send(html);
  } catch (err: any) {
    res.status(500).send('<h3>Error loading payment session</h3>');
  }
});

// POST /api/v1/payments/webhook - Webhook handler for async Razorpay updates
router.post('/webhook', async (req, res: Response): Promise<void> => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    if (signature) {
      const isValid = verifyWebhookSignature(JSON.stringify(req.body), signature);
      if (!isValid) {
        res.status(400).json({ detail: 'Invalid webhook signature' });
        return;
      }
    }

    const event = req.body.event;
    const paymentEntity = req.body?.payload?.payment?.entity;

    if (event === 'payment.captured' && paymentEntity) {
      const razorpayOrderId = paymentEntity.order_id;
      if (razorpayOrderId) {
        const order = await Order.findOne({ razorpayOrderId });
        if (order && order.status !== 'PAID') {
          order.status = 'PAID';
          order.razorpayPaymentId = paymentEntity.id;
          await order.save();
          await grantTesterUpgradeCredits(order.items, order.user);
        }
      }
    }

    res.json({ status: 'ok' });
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(500).json({ detail: error.message });
  }
});

export default router;
