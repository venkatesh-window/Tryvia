import mongoose, { Document, Schema } from 'mongoose';

export type PayoutStatus = 'REQUESTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REJECTED' | 'CANCELLED';

export interface IPayout extends Document {
  vendor: mongoose.Types.ObjectId;
  amount: number;
  status: PayoutStatus;
  paymentReference?: string;
  bankDetailsSnapshot: {
    accountName: string;
    accountNumber: string; // Stored securely
    bankName: string;
    ifsc: string;
  };
  history: {
    status: PayoutStatus;
    changedBy?: mongoose.Types.ObjectId;
    note?: string;
    changedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const PayoutSchema = new Schema<IPayout>(
  {
    vendor: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    amount: { type: Number, required: true, min: 1 }, // Ensure positive payout amount
    status: { 
      type: String, 
      enum: ['REQUESTED', 'PROCESSING', 'COMPLETED', 'FAILED', 'REJECTED', 'CANCELLED'], 
      default: 'REQUESTED' 
    },
    paymentReference: { type: String },
    bankDetailsSnapshot: {
      accountName: { type: String, required: true },
      accountNumber: { type: String, required: true },
      bankName: { type: String, required: true },
      ifsc: { type: String, required: true },
    },
    history: [
      {
        status: { type: String, required: true },
        changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        note: { type: String },
        changedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret: any) => {
        ret.id = ret._id;
        // Mask the account number when outputting JSON
        if (ret.bankDetailsSnapshot && ret.bankDetailsSnapshot.accountNumber) {
          const accStr = String(ret.bankDetailsSnapshot.accountNumber);
          ret.bankDetailsSnapshot.accountNumber = `XXXX XXXX ${accStr.slice(-4)}`;
        }
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Payout = mongoose.model<IPayout>('Payout', PayoutSchema);
