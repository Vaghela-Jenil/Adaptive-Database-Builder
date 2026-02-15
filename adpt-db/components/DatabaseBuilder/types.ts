import { LucideIcon } from "lucide-react";

export type FieldCategory = 'display' | 'field';

export type FieldType =
  | 'text'
  | 'separator'
  | 'input-text'
  | 'input-number'
  | 'input-email'
  | 'input-phone'
  | 'input-url'
  | 'input-time'
  | 'textarea'
  | 'password'
  | 'input-otp'
  | 'checkbox'
  | 'switch'
  | 'date-picker'
  | 'tag-input'
  | 'select'
  | 'combobox'
  | 'multi-select'
  | 'toggle'
  | 'radio'
  | 'slider'
  | 'file-upload'
  | 'rating';

export type FieldAttributes = {
  id: string;
  label: string;
  span: number;
  type: FieldType;
  position?: { x: number; y: number };
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  defaultValue?: string | number | boolean;
  min?: number;
  max?: number;
  step?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  options?: string[]; // for select, radio, etc.
  multiple?: boolean;
  accept?: string; // for file upload
  rows?: number; // for textarea
  otpLength?: number; // for OTP
  marks?: boolean; // for slider
  showLabel?: boolean;
};

export type FieldTemplate = {
  id: string;
  type: FieldType;
  label: string;
  category: FieldCategory;
  icon: LucideIcon;
  defaultSpan: number;
  defaultAttributes: Partial<FieldAttributes>;
};
