import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type CampaignChannel = 'whatsapp' | 'email' | 'sms' | 'manual';
export type CampaignStatus = 'draft' | 'scheduled' | 'running' | 'completed' | 'paused' | 'failed';

export interface ICampaign extends Document {
  name: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  template?: string;
  subject?: string;
  messageBody?: string;
  audienceFilter: {
    countries?: string[];
    industries?: string[];
    categories?: string[];
    tags?: string[];
    status?: string[];
  };
  totalRecipients: number;
  stats: {
    queued: number;
    sent: number;
    delivered: number;
    read: number;
    replied: number;
    failed: number;
    optedOut: number;
    clicked: number;
    registered: number;
    leadCreated: number;
    subscriptionPurchased: number;
  };
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>(
  {
    name: { type: String, required: true, trim: true },
    channel: { type: String, enum: ['whatsapp', 'email', 'sms', 'manual'], required: true },
    status: { type: String, enum: ['draft', 'scheduled', 'running', 'completed', 'paused', 'failed'], default: 'draft' },
    template: String,
    subject: String,
    messageBody: String,
    audienceFilter: {
      countries: [String],
      industries: [String],
      categories: [String],
      tags: [String],
      status: [String],
    },
    totalRecipients: { type: Number, default: 0 },
    stats: {
      queued: { type: Number, default: 0 },
      sent: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      read: { type: Number, default: 0 },
      replied: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      optedOut: { type: Number, default: 0 },
      clicked: { type: Number, default: 0 },
      registered: { type: Number, default: 0 },
      leadCreated: { type: Number, default: 0 },
      subscriptionPurchased: { type: Number, default: 0 },
    },
    scheduledAt: Date,
    startedAt: Date,
    completedAt: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Campaign: Model<ICampaign> =
  mongoose.models.Campaign || mongoose.model<ICampaign>('Campaign', CampaignSchema);
