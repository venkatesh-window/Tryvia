import mongoose, { Document, Schema } from 'mongoose';

export type OrderStatus = 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type ItemType = 'full' | 'tester';

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  itemType: ItemType;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  platformFee: number;
  vendorEarnings: number;
}

export interface IVendorStatus {
  vendor: mongoose.Types.ObjectId;
  status: OrderStatus;
  history: { status: OrderStatus; changedAt: Date }[];
  trackingNumber?: string;
  shippingPartner?: string;
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
  vendorStatuses: IVendorStatus[];
  paymentMethod?: string;
  appliedCreditId?: number;
  shippingAddress?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  createdAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    itemType: { type: String, enum: ['full', 'tester'], required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    platformFee: { type: Number, default: 0 },
    vendorEarnings: { type: Number, default: 0 },
  },
  { _id: false }
);

const VendorStatusSchema = new Schema<IVendorStatus>(
  {
    vendor: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
    status: { type: String, enum: ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'], default: 'PENDING' },
    history: [
      {
        status: { type: String, required: true },
        changedAt: { type: Date, default: Date.now },
      },
    ],
    trackingNumber: { type: String },
    shippingPartner: { type: String },
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
    vendorStatuses: [VendorStatusSchema],
    paymentMethod: { type: String },
    appliedCreditId: { type: Number },
    shippingAddress: { type: String },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret: any) => {
        ret.id = ret.numericId || ret._id;
        ret.wallet_discount = ret.walletDiscount;
        ret.platform_fee = ret.platformFee;
        ret.total_amount = ret.totalAmount;
        ret.vendor_statuses = ret.vendorStatuses;
        ret.payment_method = ret.paymentMethod;
        ret.shipping_address = ret.shippingAddress;
        ret.razorpay_order_id = ret.razorpayOrderId;
        ret.razorpay_payment_id = ret.razorpayPaymentId;
        ret.razorpay_signature = ret.razorpaySignature;
        ret.created_at = ret.createdAt;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
