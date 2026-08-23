import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType = 'ORDER' | 'STOCK' | 'PAYOUT' | 'RETURN' | 'SYSTEM';

export interface INotification extends Document {
  user: mongoose.Types.ObjectId; // The user (vendor owner) receiving the notification
  title: string;
  description: string;
  type: NotificationType;
  read: boolean;
  relatedEntityId?: mongoose.Types.ObjectId; // Order ID, Product ID, etc.
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, enum: ['ORDER', 'STOCK', 'PAYOUT', 'RETURN', 'SYSTEM'], required: true },
    read: { type: Boolean, default: false, index: true },
    relatedEntityId: { type: Schema.Types.ObjectId }, // Flexible reference
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret: any) => {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
