import mongoose, { Document, Schema } from 'mongoose';

export type OrderStatus = 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type ItemType = 'full' | 'tester';

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  itemType: ItemType;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface IOrder extends Document {
  numericId: number;
  user: mongoose.Types.ObjectId;
  items: IOrderItem[];
  subtotal: number;
  walletDiscount: number;
  platformFee: number;
  totalAmount: number;
  status: OrderStatus;
  appliedCreditId?: number;
  shippingAddress?: string;
  createdAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    itemType: { type: String, enum: ['full', 'tester'], required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    numericId: { type: Number, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: [OrderItemSchema],
    subtotal: { type: Number, required: true },
    walletDiscount: { type: Number, default: 0 },
    platformFee: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'], default: 'PAID' },
    appliedCreditId: { type: Number },
    shippingAddress: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret: any) => {
        ret.id = ret.numericId || ret._id;
        ret.wallet_discount = ret.walletDiscount;
        ret.platform_fee = ret.platformFee;
        ret.total_amount = ret.totalAmount;
        ret.created_at = ret.createdAt;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
