import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  numericId: number;
  email: string;
  passwordHash: string;
  fullName: string;
  isActive: boolean;
  isSuperuser: boolean;
  walletBalance: number;
  loyaltyTier: string;
  stars: number;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    numericId: { type: Number, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
    isSuperuser: { type: Boolean, default: false },
    walletBalance: { type: Number, default: 350 },
    loyaltyTier: { type: String, default: 'BRONZE' },
    stars: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret: any) => {
        ret.id = ret.numericId || ret._id;
        ret.full_name = ret.fullName;
        ret.wallet_balance = ret.walletBalance;
        ret.loyalty_tier = ret.loyaltyTier;
        ret.is_active = ret.isActive;
        ret.is_superuser = ret.isSuperuser;
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export const User = mongoose.model<IUser>('User', UserSchema);
