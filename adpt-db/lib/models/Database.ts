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
    minDate: String,
    maxDate: String,

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

const ComputedColumnSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    operation: { type: String, required: true }, // 'average', 'sum', 'concatenate', etc.
    sourceFields: { type: [String], required: true },
    formula: { type: String, default: null },
    createdAt: String,
    updatedAt: String,
  },
  { _id: false }
);

const OutOfStockItemSchema = new Schema(
  {
    id: { type: String, required: true },
    productName: { type: String, required: true },
    requestedQty: { type: Number, required: true },
    availableQty: { type: Number, required: true },
    addedAt: { type: String, required: true },
  },
  { _id: false }
);

const InvoiceItemSchema = new Schema(
  {
    id: { type: String, required: true },
    recordId: { type: String, required: true },
    productName: { type: String, required: true },
    qty: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    price: { type: Number, required: true },
    taxPercent: { type: Number, required: true },
    taxAmount: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    status: { type: String, required: true },
  },
  { _id: false }
);

const InvoiceSchema = new Schema(
  {
    id: { type: String, required: true },
    date: { type: String, required: true },
    items: { type: [InvoiceItemSchema], default: [] },
    subtotal: { type: Number, required: true },
    totalTax: { type: Number, required: true },
    grandTotal: { type: Number, required: true },
    status: { type: String, required: true },
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

    computedColumns: {
      type: [ComputedColumnSchema],
      default: [],
    },

    outOfStockItems: {
      type: [OutOfStockItemSchema],
      default: [],
    },

    generatedInvoices: {
      type: [InvoiceSchema],
      default: [],
    },
  },
  { timestamps: true }
);

export const DatabaseModel =
  models.Database || model("Database", DatabaseSchema);
