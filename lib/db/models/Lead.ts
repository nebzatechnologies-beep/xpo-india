import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type LeadStatus = 'draft' | 'pending_approval' | 'live' | 'paused' | 'closed' | 'rejected' | 'expired';
export type LeadType = 'buy' | 'sell' | 'partner' | 'invest' | 'service';
export type BudgetCurrency = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED';

export interface ILead extends Document {
  xpoId: string;
  title: string;
  description: string;
  type: LeadType;
  status: LeadStatus;
  creator: Types.ObjectId;
  category: Types.ObjectId;
  subCategory?: Types.ObjectId;
  sector?: Types.ObjectId;
  country: string;
  city?: string;
  budgetMin?: number;
  budgetMax?: number;
  budgetCurrency: BudgetCurrency;
  tags: string[];
  attachments: string[];
  isFeatured: boolean;
  isAnonymous: boolean;
  viewCount: number;
  responseCount: number;
  expiresAt?: Date;
  rejectionReason?: string;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    xpoId:           { type: String, unique: true, index: true },
    title:           { type: String, required: true, trim: true },
    description:     { type: String, required: true },
    type:            { type: String, enum: ['buy', 'sell', 'partner', 'invest', 'service'], required: true },
    status:          { type: String, enum: ['draft', 'pending_approval', 'live', 'paused', 'closed', 'rejected', 'expired'], default: 'draft' },
    creator:         { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category:        { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    subCategory:     { type: Schema.Types.ObjectId, ref: 'Category' },
    sector:          { type: Schema.Types.ObjectId, ref: 'Category' },
    country:         { type: String, required: true },
    city:            { type: String },
    budgetMin:       { type: Number },
    budgetMax:       { type: Number },
    budgetCurrency:  { type: String, enum: ['INR', 'USD', 'EUR', 'GBP', 'AED'], default: 'INR' },
    tags:            [{ type: String }],
    attachments:     [{ type: String }],
    isFeatured:      { type: Boolean, default: false },
    isAnonymous:     { type: Boolean, default: false },
    viewCount:       { type: Number, default: 0 },
    responseCount:   { type: Number, default: 0 },
    expiresAt:       { type: Date },
    rejectionReason: { type: String },
    adminNotes:      { type: String },
  },
  { timestamps: true }
);

LeadSchema.index({ status: 1, category: 1, country: 1 });
LeadSchema.index({ creator: 1, status: 1 });

/** Auto-generate XPO-XXXXX ID before first save */
LeadSchema.pre('save', async function (next) {
  if (!this.xpoId) {
    const count = await mongoose.model('Lead').countDocuments();
    this.xpoId = `XPO-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

export const Lead: Model<ILead> =
  mongoose.models.Lead ?? mongoose.model<ILead>('Lead', LeadSchema);
