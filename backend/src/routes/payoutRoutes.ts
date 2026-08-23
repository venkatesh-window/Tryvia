import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Payout } from '../models/Payout';
import { VendorLedger } from '../models/VendorLedger';
import { Vendor } from '../models/Vendor';
import { Notification } from '../models/Notification';

const router = Router();

// Middleware to get current vendor
const getVendor = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user?._id });
    if (!vendor) {
      res.status(404).json({ detail: 'Vendor account not found.' });
      return;
    }
    if (vendor.status !== 'APPROVED') {
      res.status(403).json({ detail: `Access denied. Vendor status is ${vendor.status}.` });
      return;
    }
    (req as any).vendor = vendor;
    next();
  } catch (error: any) {
    res.status(500).json({ detail: error.message });
  }
};

// Middleware to check if user is admin
const requireAdmin = (req: AuthRequest, res: Response, next: any) => {
  if (req.user && (req.user.role === 'ADMIN' || req.user.isSuperuser)) {
    next();
  } else {
    res.status(403).json({ detail: 'Access denied. Admin privileges required.' });
  }
};

// Helper to calculate vendor balances
export const getVendorBalances = async (vendorId: mongoose.Types.ObjectId) => {
  const ledgerEntries = await VendorLedger.find({ vendor: vendorId });
  
  let availableBalance = 0;
  let pendingBalance = 0;
  let totalEarnings = 0;

  for (const entry of ledgerEntries) {
    if (entry.type === 'SALE') {
      if (entry.status === 'AVAILABLE') {
        availableBalance += entry.amount;
        totalEarnings += entry.amount;
      } else if (entry.status === 'PENDING') {
        pendingBalance += entry.amount;
        totalEarnings += entry.amount;
      }
    } else if (entry.type === 'REFUND' || entry.type === 'ADJUSTMENT') {
      // Refunds are typically negative amounts
      if (entry.status === 'COMPLETED') {
        availableBalance += entry.amount; // amount is negative
        totalEarnings += entry.amount;
      }
    } else if (entry.type === 'PAYOUT') {
      // Payouts deduct from available balance immediately
      if (['PENDING', 'AVAILABLE', 'COMPLETED'].includes(entry.status)) { // PENDING means requested here, AVAILABLE is processing. 
        availableBalance += entry.amount; // amount is negative
      }
    } else if (entry.type === 'PAYOUT_REVERSAL') {
      if (entry.status === 'COMPLETED') {
        availableBalance += entry.amount; // amount is positive
      }
    }
  }

  return { availableBalance, pendingBalance, totalEarnings };
};

// ==========================================
// VENDOR ENDPOINTS
// ==========================================

// GET /api/v1/payouts/vendor (Get vendor payout history and balance)
router.get('/vendor', authenticate, getVendor, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendor = (req as any).vendor;
    const payouts = await Payout.find({ vendor: vendor._id }).sort({ createdAt: -1 });
    const balances = await getVendorBalances(vendor._id as mongoose.Types.ObjectId);
    
    // Also get ledger entries for full history
    const ledger = await VendorLedger.find({ vendor: vendor._id }).sort({ createdAt: -1 }).limit(50);
    
    res.json({
      balances,
      payouts: payouts.map(p => p.toJSON()),
      ledger: ledger.map(l => l.toJSON())
    });
  } catch (error: any) {
    res.status(500).json({ detail: error.message });
  }
});

// POST /api/v1/payouts/request
router.post('/request', authenticate, getVendor, async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { amount } = req.body;
    
    if (!amount || amount < 50) { // Minimum $50 payout
      res.status(400).json({ detail: 'Minimum payout amount is $50.' });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    const vendor = (req as any).vendor;
    
    if (!vendor.payoutAccount || !vendor.payoutAccount.accountNumber) {
      res.status(400).json({ detail: 'Please set up your payout account details in store settings first.' });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    // Calculate real-time balance
    const balances = await getVendorBalances(vendor._id as mongoose.Types.ObjectId);
    
    if (amount > balances.availableBalance) {
      res.status(400).json({ detail: `Requested amount exceeds available balance of $${balances.availableBalance.toFixed(2)}` });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    // Check for existing pending payouts
    const existingPending = await Payout.findOne({ vendor: vendor._id, status: { $in: ['REQUESTED', 'PROCESSING'] } });
    if (existingPending) {
      res.status(400).json({ detail: 'You already have a payout request in progress. Please wait for it to complete.' });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    // 1. Create Payout Request
    const payout = new Payout({
      vendor: vendor._id,
      amount,
      status: 'REQUESTED',
      bankDetailsSnapshot: vendor.payoutAccount,
      history: [{ status: 'REQUESTED' }]
    });
    
    await payout.save({ session });
    
    // 2. Create Ledger Entry to deduct balance immediately
    const ledgerEntry = new VendorLedger({
      vendor: vendor._id,
      type: 'PAYOUT',
      amount: -amount, // Negative amount to reduce balance
      status: 'PENDING', // Pending until payout is completed
      reference: payout._id.toString(),
      notes: `Payout request #${payout._id.toString().substring(0,8)}`
    });
    
    await ledgerEntry.save({ session });

    await session.commitTransaction();
    res.json(payout.toJSON());
  } catch (error: any) {
    await session.abortTransaction();
    res.status(500).json({ detail: error.message });
  } finally {
    session.endSession();
  }
});

// ==========================================
// ADMIN ENDPOINTS
// ==========================================

// GET /api/v1/payouts/admin
router.get('/admin', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const payouts = await Payout.find().populate('vendor', 'storeName email').sort({ createdAt: -1 });
    res.json(payouts.map(p => p.toJSON()));
  } catch (error: any) {
    res.status(500).json({ detail: error.message });
  }
});

// PATCH /api/v1/payouts/admin/:id/status
router.patch('/admin/:id/status', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { status, paymentReference, note } = req.body;
    
    const payout = await Payout.findById(req.params.id).session(session);
    if (!payout) {
      res.status(404).json({ detail: 'Payout not found' });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    const oldStatus = payout.status;
    payout.status = status;
    payout.history.push({
      status,
      changedBy: req.user?._id as mongoose.Types.ObjectId,
      note,
      changedAt: new Date()
    });
    
    if (paymentReference) {
      payout.paymentReference = paymentReference;
    }

    await payout.save({ session });

    // Handle ledger updates based on status change
    const ledgerEntry = await VendorLedger.findOne({ reference: payout._id.toString(), type: 'PAYOUT' }).session(session);
    
    if (ledgerEntry) {
      if (status === 'COMPLETED') {
        ledgerEntry.status = 'COMPLETED';
        if (paymentReference) ledgerEntry.notes = `Completed: ${paymentReference}`;
        await ledgerEntry.save({ session });
        
        // Notify vendor
        await Notification.create([{
          user: (await Vendor.findById(payout.vendor))?.user,
          title: 'Payout Completed',
          description: `Your payout of $${payout.amount} has been successfully processed.`,
          type: 'PAYOUT',
          relatedEntityId: payout._id
        }], { session });

      } else if (status === 'FAILED' || status === 'REJECTED' || status === 'CANCELLED') {
        ledgerEntry.status = 'CANCELLED';
        await ledgerEntry.save({ session });
        
        // Create Reversal to refund the balance
        const reversal = new VendorLedger({
          vendor: payout.vendor,
          type: 'PAYOUT_REVERSAL',
          amount: payout.amount, // Positive amount to restore balance
          status: 'COMPLETED',
          reference: payout._id.toString(),
          notes: `Reversal for failed payout request`
        });
        await reversal.save({ session });
        
        // Notify vendor
        await Notification.create([{
          user: (await Vendor.findById(payout.vendor))?.user,
          title: `Payout ${status === 'REJECTED' ? 'Rejected' : 'Failed'}`,
          description: `Your payout request for $${payout.amount} was ${status.toLowerCase()}. The amount has been returned to your available balance.`,
          type: 'PAYOUT',
          relatedEntityId: payout._id
        }], { session });
      } else if (status === 'PROCESSING') {
         // Notify vendor
         await Notification.create([{
          user: (await Vendor.findById(payout.vendor))?.user,
          title: 'Payout Processing',
          description: `Your payout request for $${payout.amount} is currently being processed.`,
          type: 'PAYOUT',
          relatedEntityId: payout._id
        }], { session });
      }
    }

    await session.commitTransaction();
    res.json(payout.toJSON());
  } catch (error: any) {
    await session.abortTransaction();
    res.status(500).json({ detail: error.message });
  } finally {
    session.endSession();
  }
});

export default router;
