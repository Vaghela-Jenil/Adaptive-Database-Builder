import mongoose, { Schema, model, models } from "mongoose";

const FriendRequestSchema = new Schema(
  {
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    receiver: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending', index: true },
  },
  { timestamps: true }
);

FriendRequestSchema.index({ sender: 1, receiver: 1 }, { unique: true });

export const FriendRequest = models.FriendRequest || model("FriendRequest", FriendRequestSchema);