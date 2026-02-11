import mongoose, { Schema, model, models } from "mongoose";

// -----------------------------
// Field schema (drag-drop items)
// -----------------------------
const FieldSchema = new Schema(
  {
    id: { type: String, required: true },
    type: { type: String, required: true },

    label: { type: String, required: true },
    span: { type: Number, required: true },

    position: {
      x: { type: Number },
      y: { type: Number },
    },

    placeholder: String,
    required: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    helperText: String,

    defaultValue: Schema.Types.Mixed,

    min: Number,
    max: Number,
    step: Number,

    minLength: Number,
    maxLength: Number,
    pattern: String,

    options: [String],
    multiple: Boolean,
    accept: String,
    rows: Number,
    otpLength: Number,
    marks: Boolean,

    showLabel: { type: Boolean, default: true },
  },
  { _id: false } // important: prevents Mongo from auto-adding _id to each field
);

// -----------------------------
// Form schema
// -----------------------------
const FormSchema = new Schema(
  {
    clerkId: { type: String, required: true, index: true },
    formName: { type: String, required: true },

    fields: {
      type: [FieldSchema],
      default: [],
    },
  },
  { timestamps: true }
);

export const FormModel =
  models.Form || model("Form", FormSchema);
