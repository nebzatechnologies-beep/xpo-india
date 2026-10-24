import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type CrmContactSource = 'manual' | 'csv_import' | 'xlsx_import' | 'lead' | 'whatsapp';
export type CrmContactStatus = 'prospect' | 'lead' | 'customer' | 'churned' | 'inactive';

export interface ICrmContact extends Document {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  country?: string;
  city?: string;
  source: CrmContactSource;
  status: CrmContactStatus;
  tags: string[];
  linkedUser?: Types.ObjectId;
  notes?: string;
  importBatchId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CrmContactSchema = new Schema<ICrmContact>(
  {
    name:        { type: String, required: true, trim: true },
    email:       { type: String, lowercase: true, trim: true },
    phone:       { type: String, trim: true },
    company:     { type: String, trim: true },
    country:     { type: String },
    city:        { type: String },
    source:      { type: String, enum: ['manual', 'csv_import', 'xlsx_import', 'lead', 'whatsapp'], default: 'manual' },
    status:      { type: String, enum: ['prospect', 'lead', 'customer', 'churned', 'inactive'], default: 'prospect' },
    tags:        [{ type: String }],
    linkedUser:  { type: Schema.Types.ObjectId, ref: 'User' },
    notes:       { type: String },
    importBatchId: { type: String, index: true },
  },
  { timestamps: true }
);

CrmContactSchema.index({ email: 1 }, { sparse: true });
CrmContactSchema.index({ name: 'text', email: 'text', company: 'text' });

export const CrmContact: Model<ICrmContact> =
  mongoose.models.CrmContact ?? mongoose.model<ICrmContact>('CrmContact', CrmContactSchema);
