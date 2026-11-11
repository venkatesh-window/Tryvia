import { Router } from "express";
import mongoose from "mongoose";
import { authenticate } from "../middleware/auth.js";
import { Payout } from "../models/Payout.js";
import { VendorLedger } from "../models/VendorLedger.js";
import { Vendor } from "../models/Vendor.js";
import { Notification } from "../models/Notification.js";
import { AuditLog } from "../models/AuditLog.js";
import { payoutLimiter } from "../middleware/rateLimiter.js";

const router = Router();

// Middleware to get current vendor
const getVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user?._id });
    if (!vendor) {
      res.status(404).json({ detail: "Vendor account not found." });
      return;
    }
    if (vendor.status !== "APPROVED") {
      res
        .status(403)
        .json({ detail: `Access denied. Vendor status is ${vendor.status}.` });
      return;
    }
    req.vendor = vendor;
    next();
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user && (req.user.role === "ADMIN" || req.user.isSuperuser)) {
    next();
  } else {
    res
      .status(403)
      .json({ detail: "Access denied. Admin privileges required." });
  }
};

// Helper to calculate vendor balances
export const getVendorBalances = async (vendorId, session = null) => {
  const query = VendorLedger.find({ vendor: vendorId });
  if (session) {
    query.session(session);
  }
  const ledgerEntries = await query;
  let availableBalance = 0;
  let pendingBalance = 0;
  let totalEarnings = 0;

  for (const entry of ledgerEntries) {
    if (entry.type === "SALE") {
      if (entry.status === "AVAILABLE") {
        availableBalance += entry.amount;
        totalEarnings += entry.amount;
      } else if (entry.status === "PENDING") {
        pendingBalance += entry.amount;
        totalEarnings += entry.amount;
      }
    } else if (entry.type === "REFUND" || entry.type === "ADJUSTMENT") {
      // Refunds are typically negative amounts
      if (entry.status === "COMPLETED") {
        availableBalance += entry.amount; // amount is negative
        totalEarnings += entry.amount;
      }
    } else if (entry.type === "PAYOUT") {
      // Payouts deduct from available balance immediately
      if (["PENDING", "AVAILABLE", "COMPLETED"].includes(entry.status)) {
        // PENDING means requested here, AVAILABLE is processing.
        availableBalance += entry.amount; // amount is negative
      }
    } else if (entry.type === "PAYOUT_REVERSAL") {
      if (entry.status === "COMPLETED") {
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
router.get("/vendor", authenticate, getVendor, async (req, res) => {
  try {
    const vendor = req.vendor;
    const payouts = await Payout.find({ vendor: vendor._id }).sort({
      createdAt: -1,
    });
    const balances = await getVendorBalances(vendor._id);
    // Also get ledger entries for full history
    const ledger = await VendorLedger.find({ vendor: vendor._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({
      balances,
      payouts: payouts.map((p) => p.toJSON()),
      ledger: ledger.map((l) => l.toJSON()),
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

const isTransactionUnsupported = (err) => {
  const msg = err?.message || "";
  return (
    msg.includes("Transaction") ||
    msg.includes("replica set") ||
    msg.includes("does not support")
  );
};

async function createPayoutInternal(vendor, amount, session) {
  if (
    !vendor.payoutAccount ||
    !vendor.payoutAccount.accountName ||
    !vendor.payoutAccount.accountNumber ||
    !vendor.payoutAccount.bankName ||
    !vendor.payoutAccount.ifsc
  ) {
    const err = new Error(
      "Please set up your complete payout bank details (account name, number, bank, IFSC) in store settings first.",
    );
    err.statusCode = 400;
    throw err;
  }

  const balances = await getVendorBalances(vendor._id, session);
  if (amount > balances.availableBalance) {
    const err = new Error(
      `Requested amount exceeds available balance of ₹${balances.availableBalance.toFixed(2)}`,
    );
    err.statusCode = 400;
    throw err;
  }

  const pendingQuery = Payout.findOne({
    vendor: vendor._id,
    status: { $in: ["REQUESTED", "PROCESSING"] },
  });
  if (session) pendingQuery.session(session);
  const existingPending = await pendingQuery;
  if (existingPending) {
    const err = new Error(
      "You already have a payout request in progress. Please wait for it to complete.",
    );
    err.statusCode = 400;
    throw err;
  }

  const payout = new Payout({
    vendor: vendor._id,
    amount,
    status: "REQUESTED",
    bankDetailsSnapshot: vendor.payoutAccount,
    history: [{ status: "REQUESTED" }],
  });
  await payout.save(session ? { session } : undefined);

  const ledgerEntry = new VendorLedger({
    vendor: vendor._id,
    type: "PAYOUT",
    amount: -amount,
    status: "PENDING",
    reference: payout._id.toString(),
    notes: `Payout request #${payout._id.toString().substring(0, 8)}`,
  });
  await ledgerEntry.save(session ? { session } : undefined);

  return payout;
}

// POST /api/v1/payouts/request
router.post("/request", payoutLimiter, authenticate, getVendor, async (req, res) => {
  const amount = Number(req.body?.amount);
  if (!Number.isFinite(amount) || amount < 50) {
    res.status(400).json({ detail: "Minimum payout amount is ₹50." });
    return;
  }

  const session = await mongoose.startSession();
  try {
    let payout;
    await session.withTransaction(async () => {
      payout = await createPayoutInternal(req.vendor, amount, session);
    });
    res.json(payout.toJSON());
  } catch (error) {
    if (isTransactionUnsupported(error)) {
      try {
        const payout = await createPayoutInternal(req.vendor, amount, null);
        res.json(payout.toJSON());
        return;
      } catch (fallbackErr) {
        res
          .status(fallbackErr.statusCode || 500)
          .json({ detail: fallbackErr.message });
        return;
      }
    }
    res.status(error.statusCode || 500).json({ detail: error.message });
  } finally {
    session.endSession();
  }
});

// ==========================================
// ADMIN ENDPOINTS
// ==========================================

// GET /api/v1/payouts/admin
router.get("/admin", authenticate, requireAdmin, async (req, res) => {
  try {
    const payouts = await Payout.find()
      .populate("vendor", "storeName email")
      .sort({ createdAt: -1 });
    res.json(payouts.map((p) => p.toJSON()));
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

const ALLOWED_PAYOUT_STATUSES = [
  "REQUESTED",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "REJECTED",
  "CANCELLED",
];

async function updatePayoutStatusInternal(payoutId, req, session) {
  const { status, paymentReference, note } = req.body;
  const payoutQuery = Payout.findById(payoutId);
  if (session) payoutQuery.session(session);
  const payout = await payoutQuery;
  if (!payout) {
    const err = new Error("Payout not found");
    err.statusCode = 404;
    throw err;
  }

  const oldStatus = payout.status;
  payout.status = status;
  payout.history.push({
    status,
    changedBy: req.user?._id,
    note,
    changedAt: new Date(),
  });
  if (paymentReference) {
    payout.paymentReference = paymentReference;
  }

  await payout.save(session ? { session } : undefined);

  await AuditLog.create(
    [
      {
        actorId: req.user?._id,
        actorRole: req.user?.role || "ADMIN",
        action: "UPDATE_PAYOUT_STATUS",
        targetType: "Payout",
        targetId: String(payout._id),
        ipAddress: req.ip || req.headers["x-forwarded-for"],
        userAgent: req.headers["user-agent"],
        details: {
          oldStatus,
          newStatus: status,
          paymentReference,
          note,
        },
      },
    ],
    session ? { session } : undefined,
  );

  const ledgerQuery = VendorLedger.findOne({
    reference: payout._id.toString(),
    type: "PAYOUT",
  });
  if (session) ledgerQuery.session(session);
  const ledgerEntry = await ledgerQuery;

  const vendorQuery = Vendor.findById(payout.vendor);
  if (session) vendorQuery.session(session);
  const vendorDoc = await vendorQuery;

  if (ledgerEntry) {
    if (status === "COMPLETED") {
      ledgerEntry.status = "COMPLETED";
      if (paymentReference) {
        ledgerEntry.notes = `Completed: ${paymentReference}`;
      }
      await ledgerEntry.save(session ? { session } : undefined);
      if (vendorDoc?.user) {
        await Notification.create(
          [
            {
              user: vendorDoc.user,
              title: "Payout Completed",
              description: `Your payout of ₹${payout.amount} has been successfully processed.`,
              type: "PAYOUT",
              relatedEntityId: payout._id,
            },
          ],
          session ? { session } : undefined,
        );
      }
    } else if (
      status === "FAILED" ||
      status === "REJECTED" ||
      status === "CANCELLED"
    ) {
      ledgerEntry.status = "CANCELLED";
      await ledgerEntry.save(session ? { session } : undefined);
      const reversal = new VendorLedger({
        vendor: payout.vendor,
        type: "PAYOUT_REVERSAL",
        amount: payout.amount,
        status: "COMPLETED",
        reference: payout._id.toString(),
        notes: `Reversal for failed payout request`,
      });
      await reversal.save(session ? { session } : undefined);
      if (vendorDoc?.user) {
        await Notification.create(
          [
            {
              user: vendorDoc.user,
              title: `Payout ${status === "REJECTED" ? "Rejected" : "Failed"}`,
              description: `Your payout request for ₹${payout.amount} was ${status.toLowerCase()}. The amount has been returned to your available balance.`,
              type: "PAYOUT",
              relatedEntityId: payout._id,
            },
          ],
          session ? { session } : undefined,
        );
      }
    } else if (status === "PROCESSING" && vendorDoc?.user) {
      await Notification.create(
        [
          {
            user: vendorDoc.user,
            title: "Payout Processing",
            description: `Your payout request for ₹${payout.amount} is currently being processed.`,
            type: "PAYOUT",
            relatedEntityId: payout._id,
          },
        ],
        session ? { session } : undefined,
      );
    }
  }

  return payout;
}

// PATCH /api/v1/payouts/admin/:id/status
router.patch(
  "/admin/:id/status",
  authenticate,
  requireAdmin,
  async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ detail: "Invalid payout ID" });
      return;
    }
    if (!ALLOWED_PAYOUT_STATUSES.includes(req.body?.status)) {
      res.status(400).json({ detail: "Invalid payout status" });
      return;
    }

    const session = await mongoose.startSession();
    try {
      let payout;
      await session.withTransaction(async () => {
        payout = await updatePayoutStatusInternal(req.params.id, req, session);
      });
      res.json(payout.toJSON());
    } catch (error) {
      if (isTransactionUnsupported(error)) {
        try {
          const payout = await updatePayoutStatusInternal(req.params.id, req, null);
          res.json(payout.toJSON());
          return;
        } catch (fallbackErr) {
          res
            .status(fallbackErr.statusCode || 500)
            .json({ detail: fallbackErr.message });
          return;
        }
      }
      res.status(error.statusCode || 500).json({ detail: error.message });
    } finally {
      session.endSession();
    }
  },
);

export default router;
