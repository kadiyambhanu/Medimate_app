import mongoose, { Schema, models } from "mongoose";

const ReminderSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    medicineId: { type: Schema.Types.ObjectId, ref: "Medicine", required: true },
    reminderTime: { type: String, required: true },
    doseSlot: {
      type: String,
      enum: ["morning", "afternoon", "evening", "night"],
    },
    status: {
      type: String,
      enum: ["pending", "taken", "missed", "snoozed"],
      default: "pending",
    },
    notes: { type: String },
    takenAt: { type: Date },
    snoozedUntil: { type: Date },
    scheduledDate: { type: Date, required: true },
  },
  { timestamps: true }
);

ReminderSchema.index({ userId: 1, scheduledDate: 1, status: 1 });

export default models.Reminder || mongoose.model("Reminder", ReminderSchema);
