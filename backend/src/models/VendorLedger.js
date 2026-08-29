import mongoose, { Schema } from "mongoose";

const VendorLedgerSchema = new Schema(
  {
    vendor: {
      type: Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
      index: true,
    },
    order: { type: Schema.Types.ObjectId, ref: "Order" },
    orderItemProduct: { type: Schema.Types.ObjectId, ref: "Product" },
    type: {
      type: String,
      enum: ["SALE", "REFUND", "ADJUSTMENT", "PAYOUT", "PAYOUT_REVERSAL"],
      required: true,
    },
    amount: { type: Number, required: true },
    platformFee: { type: Number },
    status: {
      type: String,
      enum: ["PENDING", "AVAILABLE", "COMPLETED", "CANCELLED"],
      required: true,
      default: "PENDING",
    },
    reference: { type: String },
    notes: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Indexes for fast balance calculation
VendorLedgerSchema.index({ vendor: 1, status: 1 });
VendorLedgerSchema.index({ vendor: 1, type: 1 });

export const VendorLedger = mongoose.model("VendorLedger", VendorLedgerSchema);
