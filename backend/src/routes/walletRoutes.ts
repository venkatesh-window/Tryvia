import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { authenticate, AuthRequest } from '../middleware/auth';
import { WalletRule } from '../models/WalletRule';
import { WalletCredit } from '../models/WalletCredit';
import { Product } from '../models/Product';

const router = Router();

// GET /api/v1/wallet/rules
router.get('/rules', async (req: AuthRequest, res: Response): Promise<void> => {
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
  } catch (error: any) {
    res.status(500).json({ detail: error.message });
  }
});

// GET /api/v1/wallet/balance
router.get('/balance', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const now = new Date();

    const activeCredits = await WalletCredit.find({
      user: user._id,
      status: 'ACTIVE',
      expiryDate: { $gt: now },
    });

    const usedCredits = await WalletCredit.find({
      user: user._id,
      status: 'USED',
    });

    const expiredCredits = await WalletCredit.find({
      user: user._id,
      $or: [{ status: 'EXPIRED' }, { status: 'ACTIVE', expiryDate: { $lte: now } }],
    });

    const totalBalance = activeCredits.reduce((sum, c) => sum + c.redeemableAmount, 0);

    res.json({
      total_balance: totalBalance || user.walletBalance || 350,
      active_credits: activeCredits.map(c => c.toJSON()),
      used_credits: usedCredits.map(c => c.toJSON()),
      expired_credits: expiredCredits.map(c => c.toJSON()),
    });
  } catch (error: any) {
    res.status(500).json({ detail: error.message });
  }
});

// GET /api/v1/wallet/eligibility/:productId
router.get('/eligibility/:productId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const productIdParam = typeof req.params.productId === 'string' ? req.params.productId : '';
    let targetProductId: any;

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
      status: 'ACTIVE',
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
  } catch (error: any) {
    res.status(500).json({ detail: error.message });
  }
});

export default router;
