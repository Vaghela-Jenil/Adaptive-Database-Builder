import { z } from "zod";

export const buildZodSchema = (fields: any[]) => {
  const shape: Record<string, z.ZodTypeAny> = {};

  fields.forEach((field) => {
    const attrs = field;
    const id = field.id; 
    let schema: z.ZodTypeAny;

    switch (field.type) {
      // =============================
      // TEXT-BASED INPUTS
      // =============================
      case "input-text":
      case "textarea":
      case "password":
      case "input-time":
      case "date-picker":
      case "input-email":
      case "input-phone":
      case "input-url":
      case "input-otp":
      case "file-upload": {
        let s = z.string();

        // 1. Specific Formats FIRST
        if (field.type === "input-email") s = s.email("Invalid email address");
        if (field.type === "input-url") s = s.url("Invalid URL");
        if (field.type === "input-phone") s = s.regex(/^[0-9+\-()\s]+$/, "Invalid phone number");
        if (field.type === "input-otp") {
          const len = attrs.otpLength || 6;
          s = s.length(len, `OTP must be ${len} digits`);
        }

        // 2. Length Constraints
        if (attrs.minLength) s = s.min(attrs.minLength, `Minimum ${attrs.minLength} characters required`);
        if (attrs.maxLength) s = s.max(attrs.maxLength, `Maximum ${attrs.maxLength} characters allowed`);

        // 3. Nullability/Requirement
        // Logic: if required, min(1). If not, allow empty string or null.
        schema = attrs.required 
          ? s.min(1, `${field.label} is required`) 
          : s.optional().or(z.literal("")).or(z.null());
        break;
      }

      // =============================
      // NUMBER-BASED INPUTS
      // =============================
      case "input-number":
      case "slider":
      case "rating": {
        let s = z.coerce.number({
          invalid_type_error: `${field.label} must be a number`,
        });

        if (attrs.min !== undefined) s = s.min(attrs.min, `Minimum value is ${attrs.min}`);
        if (attrs.max !== undefined) s = s.max(attrs.max, `Maximum value is ${attrs.max}`);

        schema = attrs.required ? s : s.optional().nullable();
        break;
      }

      // =============================
      // BOOLEAN (Checkbox/Switch)
      // =============================
      case "checkbox":
      case "switch":
        // If required, it MUST be true. If not, true/false/undefined are okay.
        schema = attrs.required 
          ? z.literal(true, { errorMap: () => ({ message: `${field.label} must be checked` }) })
          : z.boolean().optional();
        break;

      // =============================
      // ENUMERATED (Select/Radio)
      // =============================
      case "select":
      case "radio":
      case "combobox": {
        let s = z.string();
        if (attrs.options && attrs.options.length > 0) {
          // Use refine to check against dynamic options array
          s = s.refine((val) => attrs.options.includes(val), {
            message: "Invalid option selected",
          });
        }
        schema = attrs.required ? s.min(1, `${field.label} is required`) : s.optional().or(z.literal("")).or(z.null());
        break;
      }

      // =============================
      // ARRAY-BASED (Multi-select)
      // =============================
      case "multi-select":
      case "tag-input":
        schema = attrs.required 
          ? z.array(z.string()).min(1, `Select at least one ${field.label}`)
          : z.array(z.string()).optional().default([]);
        break;

      case "text":
      case "separator":
        return;

      default:
        schema = z.any();
    }

    shape[id] = schema;
  });

  return z.object(shape);
};