import mongoose, { Schema, Document } from 'mongoose';

interface GroupMember {
  userId: mongoose.Types.ObjectId;
  userName: string;
  userImage?: string;
  role: 'admin' | 'member';
  blockedMembers: mongoose.Types.ObjectId[];
}

interface IGroup extends Document {
  name: string;
  icon?: string;
  description?: string;
  members: GroupMember[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema = new Schema<IGroup>(
  {
    name: { type: String, required: true },
    icon: { type: String, default: null },
    description: { type: String, default: null },
    members: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        userName: { type: String, required: true },
        userImage: { type: String, default: null },
        role: { type: String, enum: ['admin', 'member'], default: 'member' },
        blockedMembers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      },
    ],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Group = mongoose.models.Group || mongoose.model<IGroup>('Group', GroupSchema);
