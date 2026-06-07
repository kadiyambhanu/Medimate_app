import mongoose, { Schema, models } from "mongoose";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const DoctorScheduleSchema = new Schema(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true, unique: true, index: true },
    availableDays: {
      type: [{ type: String, enum: DAYS }],
      default: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    },
    startTime: { type: String, required: true, default: "09:00" },
    endTime: { type: String, required: true, default: "17:00" },
    slotDuration: { type: Number, required: true, default: 30 },
    breakTime: { type: String },
  },
  { timestamps: true }
);

export default models.DoctorSchedule || mongoose.model("DoctorSchedule", DoctorScheduleSchema);
