import mongoose, { Schema } from "mongoose";

const SystemConfigSchema = new Schema(
  {
    platformCommissionRate: { type: Number, default: 0.15 },
  },
  {
    timestamps: true,
  },
);

export const SystemConfig = mongoose.model("SystemConfig", SystemConfigSchema);
