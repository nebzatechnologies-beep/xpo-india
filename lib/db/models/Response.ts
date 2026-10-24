import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type ResponseStatus = 'pending' | 'viewed' | 'shortlisted' | 'rejected' | 'connected';

export interface IResponse extends Document {
  lead: Types.ObjectId;
  absorber: Types.ObjectId;
  message: string;
  attachments: string[];
  status: ResponseStatus;
  isViewed: boolean;
  viewedAt?: Date;
  proposal?: {
    budget?: number;
    currency?: string;
    timeline?: string;
    notes?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ResponseSchema = new Schema<IResponse>(
  {
    lead:        { type: Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    absorber:    { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    message:     { type: String, required: true },
    attachments: [{ type: String }],
    status:      { type: String, enum: ['pending', 'viewed', 'shortlisted', 'rejected', 'connected'], default: 'pending' },
    isViewed:    { type: Boolean, default: false },
    viewedAt:    { type: Date },
    proposal: {
      budget:   { type: Number },
      currency: { type: String },
      timeline: { type: String },
      notes:    { type: String },
    },
  },
  { timestamps: true }
);

// Each absorber can only respond once per lead
ResponseSchema.index({ lead: 1, absorber: 1 }, { unique: true });

export const Response: Model<IResponse> =
  mongoose.models.Response ?? mongoose.model<IResponse>('Response', ResponseSchema);
