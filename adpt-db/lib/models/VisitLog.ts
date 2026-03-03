import mongoose, { Schema, model, models } from "mongoose";

const VisitEntrySchema = new Schema(
  {
    path: { type: String, required: true },
    visitedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const VisitLogSchema = new Schema(
  {
    clerkId: { type: String, required: true, index: true },
    visits: { type: [VisitEntrySchema], default: [] },
  },
  { timestamps: false }
);

// Index for efficient aggregation on nested visit dates
VisitLogSchema.index({ "visits.visitedAt": -1 });

// Handle Mongoose hot-reload in Next.js dev — always use the latest schema
if (models.VisitLog) {
  mongoose.deleteModel("VisitLog");
}

export const VisitLog = model("VisitLog", VisitLogSchema);
