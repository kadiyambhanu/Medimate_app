export const APP_NAME = "MediMate";

export const ROLES = {
  PATIENT: "user",
  SUPER_ADMIN: "SUPER_ADMIN",
  HOSPITAL: "HOSPITAL",
} as const;

export type AppRole = (typeof ROLES)[keyof typeof ROLES];

export const APPOINTMENT_STATUSES = ["BOOKED", "COMPLETED", "CANCELLED"] as const;

export const PAYMENT_METHODS = [
  { value: "UPI", label: "UPI", description: "Scan QR with Google Pay, PhonePe, or Paytm" },
  { value: "PAY_AT_HOSPITAL", label: "Pay at Hospital", description: "Pay ₹400 appointment fee at the hospital" },
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]["value"];

export const PAYMENT_STATUSES = ["PENDING", "COMPLETED"] as const;

export const APPOINTMENT_FEE = 400;

export const HOSPITAL_STATUSES = ["active", "inactive"] as const;

export const WEEK_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export const APP_DESCRIPTION =
  "Your personal medicine reminder and prescription management companion";

export const MEDICINE_FREQUENCIES = [
  "Once Daily",
  "Twice Daily",
  "Thrice Daily",
  "Four Times Daily",
  "As Needed",
  "Weekly",
  "Monthly",
] as const;

export const FOOD_INSTRUCTIONS = [
  "Before Breakfast",
  "After Breakfast",
  "Before Lunch",
  "After Lunch",
  "Before Dinner",
  "After Dinner",
  "Before Food",
  "After Food",
  "Before Sleep",
  "Empty Stomach",
] as const;

export const RELATION_TYPES = [
  "Spouse",
  "Parent",
  "Child",
  "Sibling",
  "Grandparent",
  "Friend",
  "Other",
] as const;

export const REMINDER_STATUSES = ["pending", "taken", "missed", "snoozed"] as const;

export const MEDICINE_STATUSES = ["active", "inactive", "completed"] as const;

export const NOTIFICATION_STATUSES = ["unread", "read"] as const;

export const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "hi", label: "Hindi" },
] as const;

export const ITEMS_PER_PAGE = 10;

export const DEFAULT_REMINDER_TIMES = {
  morning: "08:00",
  afternoon: "13:00",
  evening: "17:00",
  night: "21:00",
} as const;

export const REMINDER_SCHEDULE_DAYS = 30;
