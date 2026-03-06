// models/Query.ts
import mongoose from "mongoose";

const QuerySchema = new mongoose.Schema({
  userId: { type: String, required: true }, // Clerk User ID
  user: { type: String, required: true },   // Display Name
  email: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ["pending", "resolved"], default: "pending" },
  priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  adminReply: { type: String, default: "" },
  isReadByUser: { type: Boolean, default: false }, // For notifications
  createdAt: { type: Date, default: Date.now },
});

export const Query = mongoose.models.Query || mongoose.model("Query", QuerySchema);