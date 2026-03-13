import { FieldAttributes } from "./types";

export const FORM_TEMPLATES: Record<string, FieldAttributes[]> = {
  education: [
    { id: "header-edu", type: "text", label: "University Admission Form", span: 3, showLabel: false },
    { id: "std-name", type: "input-text", label: "Legal Full Name", span: 2, placeholder: "John Doe", required: true },
    { id: "std-photo", type: "file-upload", label: "ID Photo", span: 1, accept: "image/*" },
    { id: "std-dob", type: "date-picker", label: "Date of Birth", span: 1, required: true },
    { id: "std-email", type: "input-email", label: "Personal Email", span: 1, placeholder: "email@example.com", required: true },
    { id: "std-phone", type: "input-phone", label: "Phone Number", span: 1, placeholder: "+1..." },
    { id: "std-program", type: "combobox", label: "Select Major", span: 1, options: ["Engineering", "Medicine", "Law", "Arts"] },
    { id: "std-scholar", type: "switch", label: "Applying for Scholarship", span: 1.5, defaultValue: false },
    { id: "std-gpa", type: "input-number", label: "Previous GPA", span: 1, min: 0, max: 4, step: 0.1 },
    { id: "std-essay", type: "textarea", label: "Statement of Purpose", span: 2, rows: 4, maxLength: 1000 },
    { id: "std-skills", type: "tag-input", label: "Extracurricular Skills", span: 3, placeholder: "Add skills..." },
    { id: "std-verify", type: "input-otp", label: "Identity Verification", span: 1.5, otpLength: 4 },
    { id: "std-agree", type: "checkbox", label: "I agree to university policies", span: 1.5, required: true }
  ],

  pharmacy: [
    { id: "rx-sep", type: "separator", label: "Prescription Details", span: 3, showLabel: false },
    { id: "rx-patient", type: "input-text", label: "Patient Name", span: 2, required: true },
    { id: "rx-gender", type: "radio", label: "Gender", span: 1, options: ["Male", "Female", "Other"] },
    { id: "rx-search", type: "combobox", label: "Medication Search", span: 2, options: ["Paracetamol", "Insulin", "Atorvastatin"] },
    { id: "rx-qty", type: "input-number", label: "Quantity", span: 1, min: 1 },
    { id: "rx-time", type: "input-time", label: "Intake Time", span: 1 },
    { id: "rx-upload", type: "file-upload", label: "Scan Prescription", span: 1, accept: ".pdf,image/*" },
    { id: "rx-allergic", type: "multi-select", label: "Known Allergies", span: 1, options: ["Penicillin", "Sulfa", "Latex"] },
    { id: "rx-intensity", type: "slider", label: "Pain Level (1-10)", span: 2, min: 1, max: 10, defaultValue: 5 },
    { id: "rx-insurance", type: "switch", label: "Use Insurance", span: 1 },
    { id: "rx-history", type: "textarea", label: "Medical History", span: 3, rows: 3 },
    { id: "rx-rating", type: "rating", label: "Consultation Rating", span: 3, max: 5 }
  ],

  retail: [
    { id: "ret-order", type: "input-text", label: "Order ID", span: 1, placeholder: "#12345" },
    { id: "ret-date", type: "date-picker", label: "Purchase Date", span: 1 },
    { id: "ret-store", type: "select", label: "Store Location", span: 1, options: ["Downtown", "Airport", "Online"] },
    { id: "ret-items", type: "tag-input", label: "Items Purchased", span: 2 },
    { id: "ret-price", type: "slider", label: "Price Satisfaction", span: 1, min: 0, max: 100 },
    { id: "ret-reason", type: "radio", label: "Reason for Contact", span: 1.5, options: ["Return", "Warranty", "General"] },
    { id: "ret-method", type: "toggle", label: "Refund Method", span: 1.5, options: ["Credit", "Bank", "Original"] },
    { id: "ret-upload", type: "file-upload", label: "Item Photos", span: 2, multiple: true },
    { id: "ret-urgent", type: "switch", label: "Urgent Request", span: 1 },
    { id: "ret-desc", type: "textarea", label: "Comment", span: 3 },
    { id: "ret-rate", type: "rating", label: "Service Rating", span: 3 }
  ],

  homeExpense: [
    { id: "exp-cat", type: "select", label: "Category", span: 1, options: ["Groceries", "Rent", "Fuel", "Streaming"] },
    { id: "exp-val", type: "input-number", label: "Amount Spent", span: 1, required: true },
    { id: "exp-date", type: "date-picker", label: "Transaction Date", span: 1 },
    { id: "exp-vendor", type: "input-text", label: "Merchant Name", span: 1.5 },
    { id: "exp-web", type: "input-url", label: "Online Receipt Link", span: 1.5 },
    { id: "exp-recurring", type: "switch", label: "Is Recurring Bill?", span: 1 },
    { id: "exp-tags", type: "tag-input", label: "Labels", span: 2, placeholder: "work, personal" },
    { id: "exp-priority", type: "slider", label: "Budget Priority", span: 2, defaultValue: 50 },
    { id: "exp-proof", type: "file-upload", label: "Upload Invoice", span: 1 },
    { id: "exp-note", type: "textarea", label: "Expense Description", span: 3 }
  ],

  socialEvent: [
    { id: "soc-name", type: "input-text", label: "Organizer Name", span: 1.5 },
    { id: "soc-type", type: "select", label: "Event Type", span: 1.5, options: ["Meeting", "Party", "Workshop"] },
    { id: "soc-date", type: "date-picker", label: "Event Date", span: 1 },
    { id: "soc-time", type: "input-time", label: "Start Time", span: 1 },
    { id: "soc-limit", type: "input-number", label: "Capacity Limit", span: 1 },
    { id: "soc-diet", type: "multi-select", label: "Catering Options", span: 2, options: ["Vegan", "Nut-Free", "Halal"] },
    { id: "soc-notify", type: "switch", label: "Send SMS Reminders", span: 1 },
    { id: "soc-phone", type: "input-phone", label: "RSVP Phone", span: 1 },
    { id: "soc-loc", type: "input-url", label: "Maps Location", span: 2 },
    { id: "soc-agenda", type: "textarea", label: "Event Agenda", span: 3 },
    { id: "soc-survey", type: "rating", label: "Past Event Interest", span: 3 }
  ],

  fitnessLog: [
    { id: "fit-type", type: "combobox", label: "Activity", span: 1, options: ["Running", "Yoga", "Gym", "Cycling"] },
    { id: "fit-dur", type: "input-number", label: "Duration (min)", span: 1 },
    { id: "fit-kcal", type: "input-number", label: "Calories Burned", span: 1 },
    { id: "fit-effort", type: "slider", label: "Perceived Effort", span: 2, min: 1, max: 10 },
    { id: "fit-mood", type: "toggle", label: "Energy Level", span: 1, options: ["Low", "Mid", "High"] },
    { id: "fit-water", type: "slider", label: "Water Intake (Liters)", span: 3, max: 5, step: 0.5, defaultValue: 2 },
    { id: "fit-sleep", type: "input-time", label: "Wake Up Time", span: 1 },
    { id: "fit-weight", type: "input-number", label: "Today's Weight", span: 1 },
    { id: "fit-meds", type: "switch", label: "Vitamins Taken", span: 1 },
    { id: "fit-notes", type: "textarea", label: "Workout Breakdown", span: 3 }
  ],

  employment: [
    { id: "job-role", type: "input-text", label: "Position Applied For", span: 2, required: true },
    { id: "job-exp", type: "input-number", label: "Relevant Years", span: 1 },
    { id: "job-mail", type: "input-email", label: "Work Email", span: 1.5 },
    { id: "job-web", type: "input-url", label: "Portfolio Link", span: 1.5 },
    { id: "job-skills", type: "tag-input", label: "Tech Stack", span: 3 },
    { id: "job-salary", type: "slider", label: "Expected Salary (k)", span: 2, min: 30, max: 200, defaultValue: 75 },
    { id: "job-remote", type: "switch", label: "Open to Remote", span: 1 },
    { id: "job-resume", type: "file-upload", label: "CV / Resume", span: 1.5, accept: ".pdf" },
    { id: "job-cover", type: "file-upload", label: "Cover Letter", span: 1.5, accept: ".pdf" },
    { id: "job-intro", type: "textarea", label: "Why us?", span: 3 }
  ],

  realEstate: [
    { id: "prop-addr", type: "input-text", label: "Property Address", span: 2 },
    { id: "prop-type", type: "select", label: "Type", span: 1, options: ["Apartment", "House", "Studio"] },
    { id: "prop-rooms", type: "input-number", label: "Bedrooms", span: 1, min: 1 },
    { id: "prop-bath", type: "input-number", label: "Bathrooms", span: 1, min: 1 },
    { id: "prop-sqft", type: "input-number", label: "Area (sq ft)", span: 1 },
    { id: "prop-price", type: "input-number", label: "Monthly Rent", span: 1 },
    { id: "prop-avail", type: "date-picker", label: "Available From", span: 1 },
    { id: "prop-pet", type: "switch", label: "Pets Allowed", span: 1 },
    { id: "prop-feat", type: "multi-select", label: "Amenities", span: 2, options: ["Gym", "Pool", "Parking", "AC"] },
    { id: "prop-imgs", type: "file-upload", label: "Property Photos", span: 3, multiple: true },
    { id: "prop-desc", type: "textarea", label: "Marketing Summary", span: 3 }
  ],

  travelPlan: [
    { id: "tr-dest", type: "input-text", label: "Destination City", span: 2 },
    { id: "tr-type", type: "radio", label: "Travel Mode", span: 1, options: ["Flight", "Train", "Road"] },
    { id: "tr-start", type: "date-picker", label: "Departure", span: 1 },
    { id: "tr-end", type: "date-picker", label: "Return", span: 1 },
    { id: "tr-budget", type: "slider", label: "Budget Range", span: 1, max: 10000, defaultValue: 2000 },
    { id: "tr-hotel", type: "combobox", label: "Accommodation Search", span: 2 },
    { id: "tr-pass", type: "input-otp", label: "Booking Ref PIN", span: 1, otpLength: 4 },
    { id: "tr-docs", type: "file-upload", label: "Passport & Tickets", span: 2, multiple: true },
    { id: "tr-insure", type: "switch", label: "Travel Insurance", span: 1 },
    { id: "tr-activities", type: "tag-input", label: "Planned Sights", span: 3 },
    { id: "tr-notes", type: "textarea", label: "Packing List", span: 3 }
  ],

  itSupport: [
    { id: "it-title", type: "input-text", label: "Issue Title", span: 2, required: true },
    { id: "it-sev", type: "select", label: "Severity", span: 1, options: ["Critical", "High", "Low"] },
    { id: "it-os", type: "toggle", label: "Platform", span: 1.5, options: ["Windows", "MacOS", "Linux", "Mobile"] },
    { id: "it-ver", type: "input-text", label: "Software Version", span: 1.5 },
    { id: "it-url", type: "input-url", label: "Bug URL", span: 3 },
    { id: "it-repro", type: "textarea", label: "Steps to Reproduce", span: 3, rows: 4 },
    { id: "it-shot", type: "file-upload", label: "Screenshots/Logs", span: 2, multiple: true },
    { id: "it-time", type: "input-time", label: "Time of Error", span: 1 },
    { id: "it-user", type: "input-email", label: "Reporter Email", span: 1.5 },
    { id: "it-tags", type: "tag-input", label: "Components Affected", span: 1.5 }
  ]
};