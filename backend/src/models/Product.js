import mongoose, { Schema } from "mongoose";

const ProductSchema = new Schema(
  {
    numericId: { type: Number, unique: true, index: true },
    productId: { type: String, unique: true, index: true },
    vendorId: { type: String, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    fullPrice: { type: Number, required: true },
    testerPrice: { type: Number, required: true },
    stockFull: { type: Number, default: 10 },
    stockTester: { type: Number, default: 10 },
    imageUrl: { type: String },
    ingredients: { type: String },
    sizeQuantity: { type: String },
    sampleSize: { type: String },
    usageInstructions: { type: String },
    claims: { type: String },
    brand: { type: Schema.Types.ObjectId, ref: "Brand", required: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    vendor: { type: Schema.Types.ObjectId, ref: "Vendor" },
    tags: [{ type: String }],
    isFeatured: { type: Boolean, default: false },
    isTester: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "OUT_OF_STOCK"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        ret.id = ret.numericId || ret._id;
        ret.full_price = ret.fullPrice;
        ret.tester_price = ret.testerPrice;
        ret.stock_full = ret.stockFull;
        ret.stock_tester = ret.stockTester;
        ret.image_url = ret.imageUrl;
        ret.ingredients = ret.ingredients;
        ret.sizeQuantity = ret.sizeQuantity;
        ret.sampleSize = ret.sampleSize;
        ret.usageInstructions = ret.usageInstructions;
        ret.claims = ret.claims;
        if (ret.vendor) {
          ret.vendor_id = ret.vendor;
        }
        ret.status = ret.status;
        ret.is_tester = ret.isTester;
        delete ret.__v;
        return ret;
      },
    },
  },
);

export const Product = mongoose.model("Product", ProductSchema);
