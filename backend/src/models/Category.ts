import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  numericId: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
}

const CategorySchema = new Schema<ICategory>(
  {
    numericId: { type: Number, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String },
    imageUrl: { type: String },
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

export const Category = mongoose.model<ICategory>('Category', CategorySchema);
