import mongoose, { Schema, Document } from 'mongoose';

interface IGroupMessage extends Document {
  groupId: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  senderName: string;
  senderImage?: string;
  content: string;
  type: 'text' | 'file' | 'image';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const GroupMessageSchema = new Schema<IGroupMessage>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderName: { type: String, required: true },
    senderImage: { type: String, default: null },
    content: { type: String, required: true },
    type: { type: String, enum: ['text', 'file', 'image'], default: 'text' },
    fileUrl: { type: String, default: null },
    fileName: { type: String, default: null },
    fileSize: { type: Number, default: null },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
  },
  { timestamps: true }
);

GroupMessageSchema.index({ groupId: 1, createdAt: -1 });

export const GroupMessage = mongoose.models.GroupMessage || mongoose.model<IGroupMessage>('GroupMessage', GroupMessageSchema);
