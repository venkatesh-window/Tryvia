import mongoose, { Document, Schema } from 'mongoose';
import { ItemType } from './Order';

export type ReturnStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'PICKUP_PENDING' | 'RECEIVED' | 'REFUNDED' | 'CANCELLED';

export interface IReturn extends Document {
  order: mongoose.Types.ObjectId;
  vendor: mongoose.Types.ObjectId; // Isolated to the specific vendor
  customer: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  itemType: ItemType;
  quantity: number;
  customerReason: string;
  status: ReturnStatus;
  refundAmount: number; // The amount actually refunded (may be partial)
  platformFeeRefund: number; // The TRYVIA fee that is given up
  vendorEarningsRefund: number; // The Vendor earnings that are clawed back
  history: {
    status: ReturnStatus;
    changedBy?: mongoose.Types.ObjectId;
    note?: string;
    changedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const ReturnSchema = new Schema<IReturn>(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    vendor: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    itemType: { type: String, enum: ['full', 'tester'], required: true },
    quantity: { type: Number, required: true, min: 1 },
    customerReason: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['REQUESTED', 'APPROVED', 'REJECTED', 'PICKUP_PENDING', 'RECEIVED', 'REFUNDED', 'CANCELLED'], 
      default: 'REQUESTED' 
    },
    refundAmount: { type: Number, required: true },
    platformFeeRefund: { type: Number, required: true },
    vendorEarningsRefund: { type: Number, required: true },
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
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Return = mongoose.model<IReturn>('Return', ReturnSchema);
