import mongoose, { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    clerkId: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    name: { type: String },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    image: { type: String },
    phonenumber: { type: String }
  },
  { timestamps: true }
);

export const User = models.User || model("User", UserSchema);
