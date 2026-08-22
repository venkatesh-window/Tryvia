import mongoose, { Document, Schema } from 'mongoose';

export interface IBrand extends Document {
  numericId: number;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
}

const BrandSchema = new Schema<IBrand>(
  {
    numericId: { type: Number, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String },
    logoUrl: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret: any) => {
        ret.id = ret.numericId || ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Brand = mongoose.model<IBrand>('Brand', BrandSchema);
