import mongoose, { Schema, models } from "mongoose";

const NotificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ["reminder", "missed", "system", "family"], default: "system" },
    status: { type: String, enum: ["unread", "read"], default: "unread" },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, status: 1, createdAt: -1 });

export default models.Notification || mongoose.model("Notification", NotificationSchema);
