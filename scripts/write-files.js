const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, '..', 'lib', 'db', 'models');

const campaignContent = `import mongoose, { Schema, Document, Model, Types } from 'mongoose';

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
`;

const importContent = `import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IImport extends Document {
  fileName: string;
  source: string;
  totalRows: number;
  importedCount: number;
  duplicateCount: number;
  errorCount: number;
  columnMapping?: Record<string, string>;
  tags: string[];
  importedBy?: Types.ObjectId;
  errors: Array<{ row: number; reason: string }>;
  createdAt: Date;
  updatedAt: Date;
}

const ImportSchema = new Schema<IImport>(
  {
    fileName: { type: String, required: true },
    source: { type: String, default: 'csv_upload' },
    totalRows: { type: Number, default: 0 },
    importedCount: { type: Number, default: 0 },
    duplicateCount: { type: Number, default: 0 },
    errorCount: { type: Number, default: 0 },
    columnMapping: { type: Map, of: String },
    tags: [String],
    importedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    errors: [{ row: Number, reason: String }],
  },
  { timestamps: true }
);

export const Import: Model<IImport> =
  mongoose.models.Import || mongoose.model<IImport>('Import', ImportSchema);
`;

const cmsPageContent = `import mongoose, { Schema, Document, Model } from 'mongoose';

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
`;

const settingContent = `import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISetting extends Document {
  key: string;
  group: string;
  value: any;
  label?: string;
  isSecret?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SettingSchema = new Schema<ISetting>(
  {
    key: { type: String, required: true, unique: true },
    group: { type: String, required: true },
    value: { type: Schema.Types.Mixed },
    label: String,
    isSecret: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Setting: Model<ISetting> =
  mongoose.models.Setting || mongoose.model<ISetting>('Setting', SettingSchema);
`;

const auditLogContent = `import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IAuditLog extends Document {
  user?: Types.ObjectId;
  action: string;
  targetType: string;
  targetId?: string;
  details?: Record<string, any>;
  ip?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    targetType: { type: String, required: true },
    targetId: String,
    details: Schema.Types.Mixed,
    ip: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
`;

fs.writeFileSync(path.join(modelsDir, 'Campaign.ts'), campaignContent, 'utf8');
fs.writeFileSync(path.join(modelsDir, 'Import.ts'), importContent, 'utf8');
fs.writeFileSync(path.join(modelsDir, 'CmsPage.ts'), cmsPageContent, 'utf8');
fs.writeFileSync(path.join(modelsDir, 'Setting.ts'), settingContent, 'utf8');
fs.writeFileSync(path.join(modelsDir, 'AuditLog.ts'), auditLogContent, 'utf8');

console.log('Models written successfully');
