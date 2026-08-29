import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new Schema(
  {
    numericId: { type: Number, unique: true, index: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
    isSuperuser: { type: Boolean, default: false },
    role: {
      type: String,
      enum: ["CUSTOMER", "VENDOR", "ADMIN"],
      default: "CUSTOMER",
    },
    walletBalance: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        ret.id = ret.numericId || ret._id;
        ret.full_name = ret.fullName;
        ret.wallet_balance = ret.walletBalance;
        ret.loyalty_tier = ret.loyaltyTier;
        ret.is_active = ret.isActive;
        ret.is_superuser = ret.isSuperuser;
        ret.role = ret.role;
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  },
);

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export const User = mongoose.model("User", UserSchema);
