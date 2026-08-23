import mongoose, { Document, Schema } from 'mongoose';

export interface IVendor extends Document {
  numericId: number;
  user: mongoose.Types.ObjectId;
  storeName: string;
  logo?: string;
  banner?: string;
  description?: string;
  email: string;
  phone?: string;
  address?: string;
  status: 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REJECTED';
  slug?: string;
  gst?: string;
  pan?: string;
  statusHistory: {
    status: string;
    changedBy?: mongoose.Types.ObjectId;
    reason?: string;
    changedAt: Date;
  }[];
  payoutAccount?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    ifsc: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const VendorSchema = new Schema<IVendor>(
  {
    numericId: { type: Number, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    storeName: { type: String, required: true, trim: true },
    logo: { type: String },
    banner: { type: String },
    description: { type: String },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String },
    address: { type: String },
    status: { 
      type: String, 
      enum: ['PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED'], 
      default: 'PENDING' 
    },
    slug: { type: String, unique: true, sparse: true },
    gst: { type: String },
    pan: { type: String },
    statusHistory: [
      {
        status: { type: String, required: true },
        changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        reason: { type: String },
        changedAt: { type: Date, default: Date.now },
      },
    ],
    payoutAccount: {
      accountName: { type: String },
      accountNumber: { type: String },
      bankName: { type: String },
      ifsc: { type: String },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret: any) => {
        ret.id = ret.numericId || ret._id;
        ret.store_name = ret.storeName;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Vendor = mongoose.model<IVendor>('Vendor', VendorSchema);
