import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type OtpType = 'email_verification' | 'phone_verification' | 'password_reset' | 'login';

export interface IOtp extends Document {
  userId: Types.ObjectId;
  code: string;
  type: OtpType;
  expiresAt: Date;
  used: boolean;
  attempts: number;
  createdAt: Date;
}

const OtpSchema = new Schema<IOtp>(
  {
    userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    code:      { type: String, required: true },
    type:      { type: String, enum: ['email_verification', 'phone_verification', 'password_reset', 'login'], required: true },
    expiresAt: { type: Date, required: true },
    used:      { type: Boolean, default: false },
    attempts:  { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Auto-expire OTP documents from MongoDB after TTL
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Otp: Model<IOtp> =
  mongoose.models.Otp ?? mongoose.model<IOtp>('Otp', OtpSchema);
