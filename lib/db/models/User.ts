import mongoose, { Schema, Document, Model } from 'mongoose';

export type UserRole = 'creator' | 'absorber' | 'staff' | 'superadmin';
export type AccountType = 'individual' | 'business';
export type UserStatus = 'active' | 'suspended' | 'banned' | 'pending_verification';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  accountType: AccountType;
  phone?: string;
  country?: string;
  avatar?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  status: UserStatus;
  adminNotes?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name:             { type: String, required: true, trim: true },
    email:            { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:         { type: String, select: false },
    role:             { type: String, enum: ['creator', 'absorber', 'staff', 'superadmin'], default: 'creator' },
    accountType:      { type: String, enum: ['individual', 'business'], default: 'individual' },
    phone:            { type: String, trim: true },
    country:          { type: String, trim: true },
    avatar:           { type: String },
    emailVerified:    { type: Boolean, default: false },
    phoneVerified:    { type: Boolean, default: false },
    status:           { type: String, enum: ['active', 'suspended', 'banned', 'pending_verification'], default: 'pending_verification' },
    adminNotes:       { type: String },
    lastLogin:        { type: Date },
  },
  { timestamps: true }
);

export const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>('User', UserSchema);
