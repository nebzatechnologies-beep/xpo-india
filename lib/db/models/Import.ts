import mongoose, { Schema, Document, Model, Types } from 'mongoose';

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
  importErrors: Array<{ row: number; reason: string }>;
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
    importErrors: [{ row: Number, reason: String }],
  },
  { timestamps: true }
);

export const Import: Model<IImport> =
  mongoose.models.Import || mongoose.model<IImport>('Import', ImportSchema);
