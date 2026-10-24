import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type WaDirection = 'inbound' | 'outbound';
export type WaMessageType = 'text' | 'image' | 'document' | 'audio' | 'video' | 'button' | 'interactive' | 'unknown';

export interface IWhatsAppMessage extends Document {
  waMessageId: string;
  from: string;
  to: string;
  direction: WaDirection;
  type: WaMessageType;
  body?: string;
  mediaUrl?: string;
  buttonPayload?: string;
  linkedUser?: Types.ObjectId;
  flowContext?: string; // e.g. 'lead_creation', 'support'
  rawPayload?: Record<string, unknown>;
  createdAt: Date;
}

const WhatsAppMessageSchema = new Schema<IWhatsAppMessage>(
  {
    waMessageId:   { type: String, required: true, unique: true },
    from:          { type: String, required: true },
    to:            { type: String, required: true },
    direction:     { type: String, enum: ['inbound', 'outbound'], required: true },
    type:          { type: String, enum: ['text', 'image', 'document', 'audio', 'video', 'button', 'interactive', 'unknown'], default: 'text' },
    body:          { type: String },
    mediaUrl:      { type: String },
    buttonPayload: { type: String },
    linkedUser:    { type: Schema.Types.ObjectId, ref: 'User' },
    flowContext:   { type: String },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw webhook payload
    rawPayload:    { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

WhatsAppMessageSchema.index({ from: 1, createdAt: -1 });

export const WhatsAppMessage: Model<IWhatsAppMessage> =
  mongoose.models.WhatsAppMessage ?? mongoose.model<IWhatsAppMessage>('WhatsAppMessage', WhatsAppMessageSchema);
