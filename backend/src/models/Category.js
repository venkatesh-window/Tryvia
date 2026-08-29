import mongoose, { Schema } from "mongoose";

const CategorySchema = new Schema(
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
      transform: (_, ret) => {
        ret.id = ret.numericId || ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

export const Category = mongoose.model("Category", CategorySchema);
