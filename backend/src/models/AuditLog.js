import mongoose, { Schema } from "mongoose";

const AuditLogSchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User" },
    actorRole: { type: String, required: true },
    action: { type: String, required: true },
    targetType: { type: String, required: true },
    targetId: { type: String, required: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    details: { type: Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Append-only (never updated)
  },
);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ actorId: 1 });
AuditLogSchema.index({ targetType: 1, targetId: 1 });

export const AuditLog = mongoose.model("AuditLog", AuditLogSchema);
