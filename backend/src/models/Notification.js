import mongoose, { Schema } from "mongoose";

const NotificationSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: {
      type: String,
      enum: ["ORDER", "STOCK", "PAYOUT", "RETURN", "SYSTEM"],
      required: true,
    },
    read: { type: Boolean, default: false, index: true },
    relatedEntityId: { type: Schema.Types.ObjectId }, // Flexible reference
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

export const Notification = mongoose.model("Notification", NotificationSchema);
