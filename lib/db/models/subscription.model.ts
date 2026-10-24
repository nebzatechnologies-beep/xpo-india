import mongoose, { Document, Schema, Model } from "mongoose";
export type SubscriptionStatus = "trial"|"active"|"expired"|"cancelled"|"paused"|"payment_failed";
export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId; planId: mongoose.Types.ObjectId; role: "creator"|"absorber";
  status: SubscriptionStatus; startDate: Date; endDate: Date;
  gateway: "razorpay"|"paypal"|"manual"|"free"; gatewaySubscriptionId?: string; gatewayCustomerId?: string;
  autoRenew: boolean; leadsPosted: number; responsesViewed: number; proposalsSubmitted: number; contactsUnlocked: number;
  cancelledAt?: Date; cancelReason?: string; createdAt: Date; updatedAt: Date;
}
const SubscriptionSchema = new Schema<ISubscription>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  planId: { type: Schema.Types.ObjectId, ref: "Plan", required: true },
  role: { type: String, enum: ["creator","absorber"], required: true },
  status: { type: String, enum: ["trial","active","expired","cancelled","paused","payment_failed"], default: "trial" },
  startDate: { type: Date, required: true }, endDate: { type: Date, required: true },
  gateway: { type: String, enum: ["razorpay","paypal","manual","free"], required: true },
  gatewaySubscriptionId: String, gatewayCustomerId: String, autoRenew: { type: Boolean, default: true },
  leadsPosted: { type: Number, default: 0 }, responsesViewed: { type: Number, default: 0 },
  proposalsSubmitted: { type: Number, default: 0 }, contactsUnlocked: { type: Number, default: 0 },
  cancelledAt: Date, cancelReason: String,
}, { timestamps: true });
SubscriptionSchema.index({ userId: 1, status: 1 }); SubscriptionSchema.index({ endDate: 1 });
const Subscription: Model<ISubscription> = mongoose.models.Subscription || mongoose.model<ISubscription>("Subscription", SubscriptionSchema);
export default Subscription;
