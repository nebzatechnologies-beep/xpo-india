import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type PaymentStatus = 'pending' | 'captured' | 'failed' | 'refunded' | 'partially_refunded';
export type PaymentGateway = 'razorpay' | 'paypal';
export type PaymentType = 'one_time' | 'subscription';

export interface IPayment extends Document {
  user: Types.ObjectId;
  plan?: Types.ObjectId;
  subscription?: Types.ObjectId;
  gateway: PaymentGateway;
  type: PaymentType;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  gatewaySubscriptionId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  refundAmount?: number;
  metadata?: Record<string, unknown>;
  webhookEventId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    user:                  { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    plan:                  { type: Schema.Types.ObjectId, ref: 'Plan' },
    subscription:          { type: Schema.Types.ObjectId, ref: 'Subscription' },
    gateway:               { type: String, enum: ['razorpay', 'paypal'], required: true },
    type:                  { type: String, enum: ['one_time', 'subscription'], default: 'one_time' },
    gatewayOrderId:        { type: String, index: true },
    gatewayPaymentId:      { type: String, index: true },
    gatewaySubscriptionId: { type: String, index: true },
    amount:                { type: Number, required: true },
    currency:              { type: String, default: 'INR' },
    status:                { type: String, enum: ['pending', 'captured', 'failed', 'refunded', 'partially_refunded'], default: 'pending' },
    refundAmount:          { type: Number },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- arbitrary gateway metadata
    metadata:              { type: Schema.Types.Mixed },
    webhookEventId:        { type: String },
  },
  { timestamps: true }
);

export const Payment: Model<IPayment> =
  mongoose.models.Payment ?? mongoose.model<IPayment>('Payment', PaymentSchema);
