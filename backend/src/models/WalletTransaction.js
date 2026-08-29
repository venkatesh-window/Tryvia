import mongoose, { Schema } from "mongoose";

const WalletTransactionSchema = new Schema(
  {
    numericId: { type: Number, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["CREDIT", "DEBIT"], required: true },
    source: {
      type: String,
      enum: ["MINI_PRODUCT_PURCHASE", "ORIGINAL_PRODUCT_PURCHASE"],
      required: true,
    },
    amount: { type: Number, required: true },
    order: { type: Schema.Types.ObjectId, ref: "Order" },
    description: { type: String },
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
  }
);

export const WalletTransaction = mongoose.model(
  "WalletTransaction",
  WalletTransactionSchema
);
