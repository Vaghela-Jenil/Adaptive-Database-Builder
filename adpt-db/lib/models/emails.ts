import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailLog extends Document {
  subject: string;
  body: string;
  recipientEmail: string;
  recipientName: string;
  status: string;
  sentAt: Date;
}

const EmailLogSchema = new Schema<IEmailLog>({
  subject: { type: String, required: true },
  body: { type: String, required: true },
  recipientEmail: { type: String, required: true },
  recipientName: { type: String, required: true },
  status: { type: String, default: 'sent' },
  sentAt: { type: Date, default: Date.now }
});

export const EmailLogs =  mongoose.models.EmailLog || mongoose.model<IEmailLog>('EmailLog', EmailLogSchema);