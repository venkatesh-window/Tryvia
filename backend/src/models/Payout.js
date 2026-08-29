import mongoose, { Schema } from "mongoose";

const PayoutSchema = new Schema(
  {
    vendor: {
      type: Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 1 }, // Ensure positive payout amount
    status: {
      type: String,
      enum: [
        "REQUESTED",
        "PROCESSING",
        "COMPLETED",
        "FAILED",
        "REJECTED",
        "CANCELLED",
      ],
      default: "REQUESTED",
    },
    paymentReference: { type: String },
    bankDetailsSnapshot: {
      accountName: { type: String, required: true },
      accountNumber: { type: String, required: true },
      bankName: { type: String, required: true },
      ifsc: { type: String, required: true },
    },
    history: [
      {
        status: { type: String, required: true },
        changedBy: { type: Schema.Types.ObjectId, ref: "User" },
        note: { type: String },
        changedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        ret.id = ret._id;
        // Mask the account number when outputting JSON
        if (ret.bankDetailsSnapshot && ret.bankDetailsSnapshot.accountNumber) {
          const accStr = String(ret.bankDetailsSnapshot.accountNumber);
          ret.bankDetailsSnapshot.accountNumber = `XXXX XXXX ${accStr.slice(-4)}`;
        }
        delete ret.__v;
        return ret;
      },
    },
  },
);

export const Payout = mongoose.model("Payout", PayoutSchema);
