import { FieldTemplate } from "./types";

export const fieldTemplates: FieldTemplate[] = [
  // DISPLAY ELEMENTS
  {
    id: 'text',
    type: 'text',
    label: 'Text',
    category: 'display',
    icon: '📝',
    defaultSpan: 3,
    defaultAttributes: {
      label: 'Text Label',
      span: 3,
      showLabel: false,
    },
  },
  {
    id: 'separator',
    type: 'separator',
    label: 'Separator',
    category: 'display',
    icon: '➖',
    defaultSpan: 3,
    defaultAttributes: {
      label: 'Separator',
      span: 3,
      showLabel: false,
    },
  },

  // FIELD ELEMENTS - INPUT VARIANTS
  {
    id: 'input-text',
    type: 'input-text',
    label: 'Input',
    category: 'field',
    icon: '✏️',
    defaultSpan: 1,
    defaultAttributes: {
      label: 'Text Input',
      placeholder: 'Enter text...',
      required: false,
      disabled: false,
      span: 1,
      showLabel: true,
    },
  },
  {
    id: 'input-number',
    type: 'input-number',
    label: 'Number',
    category: 'field',
    icon: '🔢',
    defaultSpan: 1,
    defaultAttributes: {
      label: 'Number Input',
      placeholder: 'Enter number...',
      required: false,
      disabled: false,
      span: 1,
      min: 0,
      max: 100,
      step: 1,
      showLabel: true,
    },
  },
  {
    id: 'input-email',
    type: 'input-email',
    label: 'Email',
    category: 'field',
    icon: '📧',
    defaultSpan: 1,
    defaultAttributes: {
      label: 'Email Address',
      placeholder: 'email@example.com',
      required: false,
      disabled: false,
      span: 1,
      showLabel: true,
    },
  },
  {
    id: 'input-phone',
    type: 'input-phone',
    label: 'Phone Number',
    category: 'field',
    icon: '📱',
    defaultSpan: 1,
    defaultAttributes: {
      label: 'Phone Number',
      placeholder: '+1 (555) 000-0000',
      required: false,
      disabled: false,
      span: 1,
      showLabel: true,
    },
  },
  {
    id: 'input-url',
    type: 'input-url',
    label: 'URL',
    category: 'field',
    icon: '🔗',
    defaultSpan: 1,
    defaultAttributes: {
      label: 'Website URL',
      placeholder: 'https://example.com',
      required: false,
      disabled: false,
      span: 1,
      showLabel: true,
    },
  },
  {
    id: 'input-time',
    type: 'input-time',
    label: 'Time',
    category: 'field',
    icon: '🕐',
    defaultSpan: 1,
    defaultAttributes: {
      label: 'Time',
      required: false,
      disabled: false,
      span: 1,
      showLabel: true,
    },
  },

  // TEXTAREA
  {
    id: 'textarea',
    type: 'textarea',
    label: 'Text Area',
    category: 'field',
    icon: '📄',
    defaultSpan: 3,
    defaultAttributes: {
      label: 'Description',
      placeholder: 'Enter detailed text...',
      required: false,
      disabled: false,
      span: 3,
      rows: 4,
      minLength: 0,
      maxLength: 500,
      showLabel: true,
    },
  },

  // PASSWORD
  {
    id: 'password',
    type: 'password',
    label: 'Password',
    category: 'field',
    icon: '🔒',
    defaultSpan: 1,
    defaultAttributes: {
      label: 'Password',
      placeholder: 'Enter password...',
      required: false,
      disabled: false,
      span: 1,
      minLength: 8,
      showLabel: true,
    },
  },

  // INPUT OTP
  {
    id: 'input-otp',
    type: 'input-otp',
    label: 'OTP',
    category: 'field',
    icon: '🔐',
    defaultSpan: 1,
    defaultAttributes: {
      label: 'Enter OTP',
      required: false,
      disabled: false,
      span: 1,
      otpLength: 6,
      showLabel: true,
    },
  },

  // CHECKBOX
  {
    id: 'checkbox',
    type: 'checkbox',
    label: 'Checkbox',
    category: 'field',
    icon: '☑️',
    defaultSpan: 1,
    defaultAttributes: {
      label: 'I agree to terms',
      required: false,
      disabled: false,
      span: 1,
      defaultValue: false,
      showLabel: true,
    },
  },

  // SWITCH
  {
    id: 'switch',
    type: 'switch',
    label: 'Switch',
    category: 'field',
    icon: '🎚️',
    defaultSpan: 1,
    defaultAttributes: {
      label: 'Enable notifications',
      required: false,
      disabled: false,
      span: 1,
      defaultValue: false,
      showLabel: true,
    },
  },

  // DATE PICKER
  {
    id: 'date-picker',
    type: 'date-picker',
    label: 'Date Picker',
    category: 'field',
    icon: '📅',
    defaultSpan: 1,
    defaultAttributes: {
      label: 'Select Date',
      placeholder: 'Pick a date...',
      required: false,
      disabled: false,
      span: 1,
      showLabel: true,
    },
  },

  // TAG INPUT
  {
    id: 'tag-input',
    type: 'tag-input',
    label: 'Tag',
    category: 'field',
    icon: '🏷️',
    defaultSpan: 2,
    defaultAttributes: {
      label: 'Tags',
      placeholder: 'Add tags...',
      required: false,
      disabled: false,
      span: 2,
      showLabel: true,
    },
  },

  // SELECT
  {
    id: 'select',
    type: 'select',
    label: 'Select',
    category: 'field',
    icon: '📋',
    defaultSpan: 1,
    defaultAttributes: {
      label: 'Select Option',
      placeholder: 'Choose one...',
      required: false,
      disabled: false,
      span: 1,
      options: ['Option 1', 'Option 2', 'Option 3'],
      showLabel: true,
    },
  },

  // COMBOBOX
  {
    id: 'combobox',
    type: 'combobox',
    label: 'Combobox',
    category: 'field',
    icon: '🔽',
    defaultSpan: 1,
    defaultAttributes: {
      label: 'Search & Select',
      placeholder: 'Search...',
      required: false,
      disabled: false,
      span: 1,
      options: ['Option 1', 'Option 2', 'Option 3'],
      showLabel: true,
    },
  },

  // MULTI SELECT
  {
    id: 'multi-select',
    type: 'multi-select',
    label: 'Multi Select',
    category: 'field',
    icon: '✅',
    defaultSpan: 2,
    defaultAttributes: {
      label: 'Select Multiple',
      placeholder: 'Choose multiple...',
      required: false,
      disabled: false,
      span: 2,
      options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
      multiple: true,
      showLabel: true,
    },
  },

  // TOGGLE
  {
    id: 'toggle',
    type: 'toggle',
    label: 'Toggle Group',
    category: 'field',
    icon: '🔘',
    defaultSpan: 2,
    defaultAttributes: {
      label: 'Choose One',
      required: false,
      disabled: false,
      span: 2,
      options: ['Option 1', 'Option 2', 'Option 3'],
      showLabel: true,
    },
  },

  // RADIO
  {
    id: 'radio',
    type: 'radio',
    label: 'Radio Group',
    category: 'field',
    icon: '🔴',
    defaultSpan: 1,
    defaultAttributes: {
      label: 'Select One',
      required: false,
      disabled: false,
      span: 1,
      options: ['Option 1', 'Option 2', 'Option 3'],
      showLabel: true,
    },
  },

  // SLIDER
  {
    id: 'slider',
    type: 'slider',
    label: 'Slider',
    category: 'field',
    icon: '🎚️',
    defaultSpan: 2,
    defaultAttributes: {
      label: 'Select Value',
      required: false,
      disabled: false,
      span: 2,
      min: 0,
      max: 100,
      step: 1,
      defaultValue: 50,
      marks: true,
      showLabel: true,
    },
  },

  // FILE UPLOAD
  {
    id: 'file-upload',
    type: 'file',
    label: 'File Upload',
    category: 'field',
    icon: '📎',
    defaultSpan: 2,
    defaultAttributes: {
      label: 'Upload File',
      required: false,
      disabled: false,
      span: 2,
      accept: '*',
      multiple: false,
      showLabel: true,
    },
  },

  // RATING
  {
    id: 'rating',
    type: 'rating',
    label: 'Rating',
    category: 'field',
    icon: '⭐',
    defaultSpan: 1,
    defaultAttributes: {
      label: 'Rate this',
      required: false,
      disabled: false,
      span: 1,
      max: 5,
      defaultValue: 0,
      showLabel: true,
    },
  },
];
