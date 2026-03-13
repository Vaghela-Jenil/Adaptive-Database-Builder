import mongoose, { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    clerkId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    userName: { type: String, trim: true },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    banned: { type: Boolean, default: false }, 
    userImage: { type: String, default: null },
    password: { type: String, default: null, select: false },
    phonenumber: { type: String, trim: true },
    lastActiveAt: { type: Date, default: Date.now },
    // Chat-related fields
    friends: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    blockedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    chatStatus: { type: String, enum: ['online', 'offline', 'away'], default: 'offline' },
    lastSeen: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const User = models.User || model("User", UserSchema);