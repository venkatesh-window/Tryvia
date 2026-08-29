import mongoose, { Schema } from "mongoose";

const WalletRuleSchema = new Schema(
  {
    minTesterPurchase: { type: Number, default: 200 },
    redeemPercentage: { type: Number, default: 0.9 }, // 90%
    platformFeePercentage: { type: Number, default: 0.1 }, // 10%
    expiryDays: { type: Number, default: 30 },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        ret.min_tester_purchase = ret.minTesterPurchase;
        ret.redeem_percentage = ret.redeemPercentage;
        ret.platform_fee_percentage = ret.platformFeePercentage;
        ret.expiry_days = ret.expiryDays;
        delete ret.__v;
        return ret;
      },
    },
  },
);

export const WalletRule = mongoose.model("WalletRule", WalletRuleSchema);
