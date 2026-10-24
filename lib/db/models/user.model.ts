import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ILoginEntry {
  ip: string;
  userAgent: string;
  date: Date;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  whatsapp?: string;
  country?: string;
  state?: string;
  city?: string;
  role: 'superadmin' | 'staff' | 'creator' | 'absorber';
  roles: string[];
  accountType: 'individual' | 'company';
  companyName?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
  isSuspended: boolean;
  isBlocked: boolean;
  profileCompleted: boolean;
  avatar?: string;
  lastLogin?: Date;
  loginHistory: ILoginEntry[];
  adminNotes?: string;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LoginEntrySchema = new Schema<ILoginEntry>({
  ip: { type: String },
  userAgent: { type: String },
  date: { type: Date, default: Date.now },
}, { _id: false });

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, select: false },
  phone: { type: String, trim: true },
  whatsapp: { type: String, trim: true },
  country: { type: String },
  state: { type: String },
  city: { type: String },
  role: { type: String, enum: ['superadmin', 'staff', 'creator', 'absorber'], default: 'creator' },
  roles: [{ type: String }],
  accountType: { type: String, enum: ['individual', 'company'], default: 'individual' },
  companyName: { type: String },
  isEmailVerified: { type: Boolean, default: false },
  isPhoneVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  isSuspended: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  profileCompleted: { type: Boolean, default: false },
  avatar: { type: String },
  lastLogin: { type: Date },
  loginHistory: { type: [LoginEntrySchema], default: [] },
  adminNotes: { type: String },
  deletedAt: { type: Date },
}, { timestamps: true });

UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ country: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ deletedAt: 1 }, { sparse: true });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
