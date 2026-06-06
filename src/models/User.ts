import mongoose, { Schema, models } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    password: { type: String, required: true },
    avatar: { type: String },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    language: { type: String, default: "en" },
    notificationSettings: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      reminderAlerts: { type: Boolean, default: true },
      missedDoseAlerts: { type: Boolean, default: true },
    },
    dailyRoutine: {
      wakeUp: { type: String, default: "06:00" },
      breakfast: { type: String, default: "08:00" },
      lunch: { type: String, default: "13:00" },
      dinner: { type: String, default: "20:00" },
      sleep: { type: String, default: "22:00" },
    },
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
  },
  { timestamps: true }
);

export default models.User || mongoose.model("User", UserSchema);
