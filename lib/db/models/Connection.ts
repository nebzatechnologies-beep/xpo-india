import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type ConnectionStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export interface IConnection extends Document {
  lead: Types.ObjectId;
  response: Types.ObjectId;
  creator: Types.ObjectId;
  absorber: Types.ObjectId;
  status: ConnectionStatus;
  contactRevealed: boolean;
  creatorContact?: {
    email?: string;
    phone?: string;
    website?: string;
  };
  absorberContact?: {
    email?: string;
    phone?: string;
    website?: string;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ConnectionSchema = new Schema<IConnection>(
  {
    lead:          { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
    response:      { type: Schema.Types.ObjectId, ref: 'Response', required: true, unique: true },
    creator:       { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    absorber:      { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status:        { type: String, enum: ['pending', 'accepted', 'declined', 'expired'], default: 'pending' },
    contactRevealed: { type: Boolean, default: false },
    creatorContact: {
      email:   { type: String },
      phone:   { type: String },
      website: { type: String },
    },
    absorberContact: {
      email:   { type: String },
      phone:   { type: String },
      website: { type: String },
    },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Connection: Model<IConnection> =
  mongoose.models.Connection ?? mongoose.model<IConnection>('Connection', ConnectionSchema);
