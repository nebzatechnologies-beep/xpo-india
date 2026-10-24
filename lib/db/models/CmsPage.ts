import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICmsPage extends Document {
  slug: string;
  title: string;
  content: Record<string, any>;
  seoTitle?: string;
  seoDescription?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CmsPageSchema = new Schema<ICmsPage>(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: String, required: true },
    content: { type: Schema.Types.Mixed, default: {} },
    seoTitle: String,
    seoDescription: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const CmsPage: Model<ICmsPage> =
  mongoose.models.CmsPage || mongoose.model<ICmsPage>('CmsPage', CmsPageSchema);
