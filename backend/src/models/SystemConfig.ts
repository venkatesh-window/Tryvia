import mongoose, { Document, Schema } from 'mongoose';

export interface ISystemConfig extends Document {
  platformCommissionRate: number; // e.g., 0.15 for 15%
}

const SystemConfigSchema = new Schema<ISystemConfig>(
  {
    platformCommissionRate: { type: Number, default: 0.15 },
  },
  {
    timestamps: true,
  }
);

export const SystemConfig = mongoose.model<ISystemConfig>('SystemConfig', SystemConfigSchema);
