import mongoose, { Document, Schema, Model } from "mongoose";
export type LeadStatus = "draft"|"pending_approval"|"live"|"paused"|"rejected"|"closed"|"completed"|"expired";
export type BudgetType = "fixed"|"range"|"negotiable"|"hourly"|"per_unit"|"quote_required";
export type LocationType = "remote"|"physical"|"hybrid"|"shipping_required";
export type LeadSource = "website"|"admin"|"whatsapp"|"excel_import"|"api"|"campaign";
export interface ILead extends Document {
  leadId: string; title: string; description: string;
  categoryId: mongoose.Types.ObjectId; subcategoryId?: mongoose.Types.ObjectId; creatorId: mongoose.Types.ObjectId;
  budgetType: BudgetType; budgetMin?: number; budgetMax?: number; currency: string; quantity?: number;
  deadline?: Date; responseDeadline?: Date; country?: string; state?: string; city?: string;
  locationType: LocationType; attachments: string[];
  status: LeadStatus; verificationStatus: "unverified"|"verified"|"flagged"; source: LeadSource;
  isFeatured: boolean; featuredUntil?: Date; viewCount: number; responseCount: number;
  rejectionReason?: string; expiresAt?: Date; postedAt?: Date; deletedAt?: Date; createdAt: Date; updatedAt: Date;
}
const LeadSchema = new Schema<ILead>({
  leadId: { type: String, required: true, unique: true },
  title: { type: String, required: true, trim: true }, description: { type: String, required: true },
  categoryId: { type: Schema.Types.ObjectId, ref: "LeadCategory", required: true },
  subcategoryId: { type: Schema.Types.ObjectId, ref: "LeadCategory" },
  creatorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  budgetType: { type: String, enum: ["fixed","range","negotiable","hourly","per_unit","quote_required"], required: true },
  budgetMin: Number, budgetMax: Number, currency: { type: String, default: "INR" }, quantity: Number,
  deadline: Date, responseDeadline: Date, country: String, state: String, city: String,
  locationType: { type: String, enum: ["remote","physical","hybrid","shipping_required"], default: "remote" },
  attachments: [String],
  status: { type: String, enum: ["draft","pending_approval","live","paused","rejected","closed","completed","expired"], default: "draft" },
  verificationStatus: { type: String, enum: ["unverified","verified","flagged"], default: "unverified" },
  source: { type: String, enum: ["website","admin","whatsapp","excel_import","api","campaign"], default: "website" },
  isFeatured: { type: Boolean, default: false }, featuredUntil: Date,
  viewCount: { type: Number, default: 0 }, responseCount: { type: Number, default: 0 },
  rejectionReason: String, expiresAt: Date, postedAt: Date, deletedAt: Date,
}, { timestamps: true });
LeadSchema.index({ leadId: 1 }); LeadSchema.index({ creatorId: 1 }); LeadSchema.index({ categoryId: 1, status: 1 }); LeadSchema.index({ status: 1, country: 1 }); LeadSchema.index({ isFeatured: -1, postedAt: -1 });
const Lead: Model<ILead> = mongoose.models.Lead || mongoose.model<ILead>("Lead", LeadSchema);
export default Lead;
