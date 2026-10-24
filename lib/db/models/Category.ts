import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parent?: Types.ObjectId;
  level: number; // 0=sector, 1=category, 2=subcategory
  order: number;
  isActive: boolean;
  leadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name:        { type: String, required: true, trim: true },
    slug:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String },
    icon:        { type: String },
    parent:      { type: Schema.Types.ObjectId, ref: 'Category', index: true },
    level:       { type: Number, required: true, default: 0 },
    order:       { type: Number, default: 0 },
    isActive:    { type: Boolean, default: true },
    leadCount:   { type: Number, default: 0 },
  },
  { timestamps: true }
);

CategorySchema.index({ parent: 1, level: 1, isActive: 1 });

export const Category: Model<ICategory> =
  mongoose.models.Category ?? mongoose.model<ICategory>('Category', CategorySchema);
