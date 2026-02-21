import mongoose, { Schema, model, models } from "mongoose";

const FieldSchema = new Schema(
  {
    id: { type: String, required: true },
    type: { type: String, required: true },

    label: { type: String, required: true },
    span: { type: Number, required: true },

    position: {
      x: Number,
      y: Number,
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
  { _id: false }
);

const RecordSchema = new Schema(
  {
    id: { type: String, required: true },
    data: { type: Schema.Types.Mixed, required: true },
    createdAt: String,
    updatedAt: String,
  },
  { _id: false }
);

const DatabaseSchema = new Schema(
  {
    clerkId: { type: String, required: true, index: true },

    DatabaseName: { type: String, required: true },

    formSchema: {
      type: [FieldSchema],
      default: [],
    },

    hasPassword: { type: Boolean, default: false },
    password: {type : String, default: ""},
    recordCount: { type: Number, default: 0 },

    records: {
      type: [RecordSchema],
      default: [],
    },
  },
  { timestamps: true }
);

export const DatabaseModel =
  models.Database || model("Database", DatabaseSchema);
