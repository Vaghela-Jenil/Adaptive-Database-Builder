import mongoose, { Schema, model, models } from "mongoose";

const FriendshipSchema = new Schema({
  requesterId: { type: String, required: true }, // The Clerk ID of sender
  requesterUsername: { type: String, required: true },
  
  recipientId: { type: String, required: true }, // The Clerk ID of receiver
  recipientUsername: { type: String, required: true },
  
  status: { type: String, enum: ["Pending", "Accepted"], default: "Pending" },
  
  // Databases the REQUESTER shared with the RECIPIENT
  requesterSharedDBs: [{
    databaseId : String,
    databaseName: String,
    role: { type: String, enum: ["Admin", "Editor", "Viewer"] },
    grantedAt: { type: Date, default: Date.now }
  }],
  
  // Databases the RECIPIENT shared with the REQUESTER
  recipientSharedDBs: [{
    databaseId : String,
    databaseName: String,
    role: { type: String, enum: ["Admin", "Editor", "Viewer"] },
    grantedAt: { type: Date, default: Date.now }
  }],
  
  createdAt: { type: Date, default: Date.now }
});

export const Friendship = models.Friendship || model("Friendship", FriendshipSchema);