import mongoose, { Schema } from "mongoose";

const OrderItemSchema = new Schema(
  {
    orderItemId: { type: String, unique: true, sparse: true, index: true },
    vendorId: { type: String, index: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    itemType: { type: String, enum: ["full", "tester"], required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    platformFee: { type: Number, default: 0 },
    vendorEarnings: { type: Number, default: 0 },
    itemStatus: {
      type: String,
      enum: ["PENDING", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"],
      default: "PENDING",
    },
    shipment: {
      courier: { type: String },
      trackingNumber: { type: String },
      shippedAt: { type: Date },
      estimatedDelivery: { type: Date },
    }
  },
  { _id: false },
);

const VendorStatusSchema = new Schema(
  {
    vendor: { type: Schema.Types.ObjectId, ref: "Vendor", required: true },
    status: {
      type: String,
      enum: [
        "PENDING",
        "PAID",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
      ],
      default: "PENDING",
    },
    history: [
      {
        status: { type: String, required: true },
        changedAt: { type: Date, default: Date.now },
      },
    ],
    trackingNumber: { type: String },
    shippingPartner: { type: String },
  },
  { _id: false },
);

const OrderSchema = new Schema(
  {
    numericId: { type: Number, unique: true, index: true },
    orderId: { type: String, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: [OrderItemSchema],
    subtotal: { type: Number, required: true },
    walletDiscount: { type: Number, default: 0 },
    platformFee: { type: Number, default: 0 },
    deliveryCharge: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"],
      default: "PAID",
    },
    vendorStatuses: [VendorStatusSchema],
    paymentMethod: { type: String },
    appliedCreditId: { type: Number },
    shippingAddress: { type: String },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    walletBalanceBefore: { type: Number },
    maximumWalletUsage: { type: Number },
    walletUsed: { type: Number },
    productAmount: { type: Number },
    walletBalanceAfter: { type: Number },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        ret.id = ret.numericId || ret._id;
        ret.wallet_discount = ret.walletDiscount;
        ret.platform_fee = ret.platformFee;
        ret.delivery_charge = ret.deliveryCharge;
        ret.total_amount = ret.totalAmount;
        ret.vendor_statuses = ret.vendorStatuses;
        ret.payment_method = ret.paymentMethod;
        ret.shipping_address = ret.shippingAddress;
        ret.razorpay_order_id = ret.razorpayOrderId;
        ret.razorpay_payment_id = ret.razorpayPaymentId;
        ret.razorpay_signature = ret.razorpaySignature;
        ret.created_at = ret.createdAt;
        ret.wallet_balance_before = ret.walletBalanceBefore;
        ret.maximum_wallet_usage = ret.maximumWalletUsage;
        ret.wallet_used = ret.walletUsed;
        ret.product_amount = ret.productAmount;
        ret.wallet_balance_after = ret.walletBalanceAfter;
        delete ret.__v;
        return ret;
      },
    },
  },
);

export const Order = mongoose.model("Order", OrderSchema);
