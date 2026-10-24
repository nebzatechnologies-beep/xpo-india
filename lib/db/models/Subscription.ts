import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired';
export type SubscriptionGateway = 'razorpay' | 'paypal' | 'manual';

export interface ISubscription extends Document {
  user: Types.ObjectId;
  plan: Types.ObjectId;
  gateway: SubscriptionGateway;
  gatewaySubscriptionId?: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelledAt?: Date;
  usageLeads: number;
  usageResponses: number;
  usageConnections: number;
  lastResetAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    user:                   { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    plan:                   { type: Schema.Types.ObjectId, ref: 'Plan', required: true },
    gateway:                { type: String, enum: ['razorpay', 'paypal', 'manual'], required: true },
    gatewaySubscriptionId:  { type: String, index: true },
    status:                 { type: String, enum: ['trial', 'active', 'past_due', 'cancelled', 'expired'], default: 'active' },
    currentPeriodStart:     { type: Date, required: true },
    currentPeriodEnd:       { type: Date, required: true },
    cancelledAt:            { type: Date },
    usageLeads:             { type: Number, default: 0 },
    usageResponses:         { type: Number, default: 0 },
    usageConnections:       { type: Number, default: 0 },
    lastResetAt:            { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Subscription: Model<ISubscription> =
  mongoose.models.Subscription ?? mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
