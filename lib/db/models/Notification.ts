import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type NotificationType =
  | 'lead_response'
  | 'lead_approved'
  | 'lead_rejected'
  | 'connection_request'
  | 'connection_accepted'
  | 'payment_success'
  | 'payment_failed'
  | 'subscription_expiring'
  | 'otp'
  | 'system';

export interface INotification extends Document {
  user: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: Date;
  link?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user:     { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type:     { type: String, required: true },
    title:    { type: String, required: true },
    message:  { type: String, required: true },
    isRead:   { type: Boolean, default: false },
    readAt:   { type: Date },
    link:     { type: String },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- arbitrary metadata
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

NotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

export const Notification: Model<INotification> =
  mongoose.models.Notification ?? mongoose.model<INotification>('Notification', NotificationSchema);
