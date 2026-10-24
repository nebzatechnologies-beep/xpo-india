import mongoose, { Document, Schema, Model } from "mongoose";
export interface ILeadCategory extends Document {
  name: string; slug: string; description?: string; icon?: string; image?: string;
  seoTitle?: string; seoDescription?: string;
  parentId?: mongoose.Types.ObjectId;
  level: "sector"|"category"|"subcategory";
  order: number; isActive: boolean; createdAt: Date; updatedAt: Date;
}
const LeadCategorySchema = new Schema<ILeadCategory>({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: String, icon: String, image: String, seoTitle: String, seoDescription: String,
  parentId: { type: Schema.Types.ObjectId, ref: "LeadCategory", default: null },
  level: { type: String, enum: ["sector","category","subcategory"], required: true },
  order: { type: Number, default: 0 }, isActive: { type: Boolean, default: true },
}, { timestamps: true });
LeadCategorySchema.index({ slug: 1 }); LeadCategorySchema.index({ parentId: 1 }); LeadCategorySchema.index({ level: 1, isActive: 1 });
const LeadCategory: Model<ILeadCategory> = mongoose.models.LeadCategory || mongoose.model<ILeadCategory>("LeadCategory", LeadCategorySchema);
export default LeadCategory;
