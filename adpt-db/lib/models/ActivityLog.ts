import mongoose, { Schema, model, models } from "mongoose";

const ActivityLogSchema = new Schema(
  {
    clerkId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: [
        "create",
        "update",
        "delete",
        "password",
        "share",
        "query",
        "login",
        "logout",
        "schema",
        "open",
        "remove_connection",
        "request_accepted",
        "access_granted",
        "access_updated",
        "friend_removed",
      ],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    timestamp: { type: Date, default: Date.now, index: true },
    metadata: {
      databaseId: String,
      databaseName: String,
      userId: String,
      userName: String,
      recordId: String,
      recordCount: Number,
      role: String,
    },
  },
  { timestamps: false }
);

// Index for efficient queries
ActivityLogSchema.index({ clerkId: 1, timestamp: -1 });
ActivityLogSchema.index({ "metadata.databaseId": 1 });

// Handle Mongoose hot-reload in Next.js dev
if (models.ActivityLog) {
  mongoose.deleteModel("ActivityLog");
}

export const ActivityLogModel = model("ActivityLog", ActivityLogSchema);
