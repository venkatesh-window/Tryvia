import mongoose, { Document, Schema } from 'mongoose';

export type LedgerEntryType = 'SALE' | 'REFUND' | 'ADJUSTMENT' | 'PAYOUT' | 'PAYOUT_REVERSAL';
export type LedgerEntryStatus = 'PENDING' | 'AVAILABLE' | 'COMPLETED' | 'CANCELLED';

export interface IVendorLedger extends Document {
  vendor: mongoose.Types.ObjectId;
  order?: mongoose.Types.ObjectId;
  orderItemProduct?: mongoose.Types.ObjectId; // For tracing back to the specific item
  type: LedgerEntryType;
  amount: number; // positive = credit to vendor, negative = debit from vendor
  platformFee?: number; // purely for audit history
  status: LedgerEntryStatus;
  reference?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VendorLedgerSchema = new Schema<IVendorLedger>(
  {
    vendor: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    order: { type: Schema.Types.ObjectId, ref: 'Order' },
    orderItemProduct: { type: Schema.Types.ObjectId, ref: 'Product' },
    type: { type: String, enum: ['SALE', 'REFUND', 'ADJUSTMENT', 'PAYOUT', 'PAYOUT_REVERSAL'], required: true },
    amount: { type: Number, required: true },
    platformFee: { type: Number },
    status: { type: String, enum: ['PENDING', 'AVAILABLE', 'COMPLETED', 'CANCELLED'], required: true, default: 'PENDING' },
    reference: { type: String },
    notes: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret: any) => {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for fast balance calculation
VendorLedgerSchema.index({ vendor: 1, status: 1 });
VendorLedgerSchema.index({ vendor: 1, type: 1 });

export const VendorLedger = mongoose.model<IVendorLedger>('VendorLedger', VendorLedgerSchema);
