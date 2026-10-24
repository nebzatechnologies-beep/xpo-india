import mongoose, { Schema, Document, Model } from 'mongoose';

export type PlanRole = 'creator' | 'absorber';
export type PlanBillingCycle = 'monthly' | 'quarterly' | 'annual' | 'lifetime';
export type PlanGateway = 'razorpay' | 'paypal' | 'both';

export interface IPlanFeatures {
  leadsPerMonth?: number;          // creator: how many leads can post
  responsesPerMonth?: number;      // absorber: how many responses can send
  connectionsPerMonth?: number;
  contactReveal: boolean;
  featuredLeads?: number;
  whatsappAlerts: boolean;
  emailAlerts: boolean;
  analyticsAccess: boolean;
  prioritySupport: boolean;
  teamMembers?: number;
  exportData: boolean;
}

export interface IPlan extends Document {
  name: string;
  slug: string;
  description?: string;
  role: PlanRole;
  billingCycle: PlanBillingCycle;
  price: number;
  currency: string;
  discountPercent?: number;
  features: IPlanFeatures;
  razorpayPlanId?: string;
  paypalPlanId?: string;
  gateway: PlanGateway;
  isActive: boolean;
  isTrial: boolean;
  trialDays?: number;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const PlanSchema = new Schema<IPlan>(
  {
    name:            { type: String, required: true, trim: true },
    slug:            { type: String, required: true, unique: true },
    description:     { type: String },
    role:            { type: String, enum: ['creator', 'absorber'], required: true },
    billingCycle:    { type: String, enum: ['monthly', 'quarterly', 'annual', 'lifetime'], default: 'monthly' },
    price:           { type: Number, required: true },
    currency:        { type: String, default: 'INR' },
    discountPercent: { type: Number },
    features: {
      leadsPerMonth:      { type: Number },
      responsesPerMonth:  { type: Number },
      connectionsPerMonth:{ type: Number },
      contactReveal:      { type: Boolean, default: false },
      featuredLeads:      { type: Number },
      whatsappAlerts:     { type: Boolean, default: false },
      emailAlerts:        { type: Boolean, default: true },
      analyticsAccess:    { type: Boolean, default: false },
      prioritySupport:    { type: Boolean, default: false },
      teamMembers:        { type: Number },
      exportData:         { type: Boolean, default: false },
    },
    razorpayPlanId: { type: String },
    paypalPlanId:   { type: String },
    gateway:        { type: String, enum: ['razorpay', 'paypal', 'both'], default: 'both' },
    isActive:       { type: Boolean, default: true },
    isTrial:        { type: Boolean, default: false },
    trialDays:      { type: Number },
    sortOrder:      { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Plan: Model<IPlan> =
  mongoose.models.Plan ?? mongoose.model<IPlan>('Plan', PlanSchema);
