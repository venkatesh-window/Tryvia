import mongoose, { Document, Schema } from 'mongoose';

export type CreditStatus = 'ACTIVE' | 'USED' | 'EXPIRED';

export interface IWalletCredit extends Document {
  numericId: number;
  user: mongoose.Types.ObjectId;
  eligibleProduct: mongoose.Types.ObjectId;
  originalAmount: number;
  redeemableAmount: number;
  platformFee: number;
  status: CreditStatus;
  expiryDate: Date;
  redeemedOrderId?: mongoose.Types.ObjectId;
}

const WalletCreditSchema = new Schema<IWalletCredit>(
  {
    numericId: { type: Number, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    eligibleProduct: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    originalAmount: { type: Number, required: true },
    redeemableAmount: { type: Number, required: true },
    platformFee: { type: Number, required: true },
    status: { type: String, enum: ['ACTIVE', 'USED', 'EXPIRED'], default: 'ACTIVE' },
    expiryDate: { type: Date, required: true },
    redeemedOrderId: { type: Schema.Types.ObjectId, ref: 'Order' },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret: any) => {
        ret.id = ret.numericId || ret._id;
        ret.eligible_product_id = ret.eligibleProduct;
        ret.original_amount = ret.originalAmount;
        ret.redeemable_amount = ret.redeemableAmount;
        ret.platform_fee = ret.platformFee;
        ret.expiry_date = ret.expiryDate;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const WalletCredit = mongoose.model<IWalletCredit>('WalletCredit', WalletCreditSchema);
