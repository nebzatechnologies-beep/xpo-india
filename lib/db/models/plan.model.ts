import mongoose, { Document, Schema, Model } from "mongoose";
export interface IPlan extends Document {
  name: string; description?: string; role: "creator"|"absorber"; price: number; currency: string;
  billingPeriod: "monthly"|"quarterly"|"half_yearly"|"annual"|"lifetime"|"custom"; customDays?: number;
  leadLimit: number; responseViewLimit: number; proposalLimit: number; contactUnlockLimit: number;
  canFeatureLead: boolean; trialDays: number; isPopular: boolean; isActive: boolean; sortOrder: number;
  features: string[]; razorpayPlanId?: string; paypalPlanId?: string; createdAt: Date; updatedAt: Date;
}
const PlanSchema = new Schema<IPlan>({
  name: { type: String, required: true }, description: String,
  role: { type: String, enum: ["creator","absorber"], required: true },
  price: { type: Number, required: true, default: 0 }, currency: { type: String, default: "INR" },
  billingPeriod: { type: String, enum: ["monthly","quarterly","half_yearly","annual","lifetime","custom"], required: true },
  customDays: Number, leadLimit: { type: Number, default: -1 }, responseViewLimit: { type: Number, default: -1 },
  proposalLimit: { type: Number, default: -1 }, contactUnlockLimit: { type: Number, default: -1 },
  canFeatureLead: { type: Boolean, default: false }, trialDays: { type: Number, default: 0 },
  isPopular: { type: Boolean, default: false }, isActive: { type: Boolean, default: true }, sortOrder: { type: Number, default: 0 },
  features: [String], razorpayPlanId: String, paypalPlanId: String,
}, { timestamps: true });
const Plan: Model<IPlan> = mongoose.models.Plan || mongoose.model<IPlan>("Plan", PlanSchema);
export default Plan;
