import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  numericId: number;
  name: string;
  description?: string;
  fullPrice: number;
  testerPrice: number;
  stockFull: number;
  stockTester: number;
  imageUrl?: string;
  brand: mongoose.Types.ObjectId;
  category: mongoose.Types.ObjectId;
  vendor?: mongoose.Types.ObjectId;
  tags?: string[];
  isFeatured?: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';
}

const ProductSchema = new Schema<IProduct>(
  {
    numericId: { type: Number, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    fullPrice: { type: Number, required: true },
    testerPrice: { type: Number, required: true },
    stockFull: { type: Number, default: 10 },
    stockTester: { type: Number, default: 10 },
    imageUrl: { type: String },
    brand: { type: Schema.Types.ObjectId, ref: 'Brand', required: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    vendor: { type: Schema.Types.ObjectId, ref: 'Vendor' },
    tags: [{ type: String }],
    isFeatured: { type: Boolean, default: false },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK'], default: 'ACTIVE' },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret: any) => {
        ret.id = ret.numericId || ret._id;
        ret.full_price = ret.fullPrice;
        ret.tester_price = ret.testerPrice;
        ret.stock_full = ret.stockFull;
        ret.stock_tester = ret.stockTester;
        ret.image_url = ret.imageUrl;
        if (ret.vendor) {
          ret.vendor_id = ret.vendor;
        }
        ret.status = ret.status;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
