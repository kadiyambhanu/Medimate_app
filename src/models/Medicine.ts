import mongoose, { Schema, models } from "mongoose";

const MedicineSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    medicineName: { type: String, required: true, trim: true },
    genericName: { type: String, trim: true },
    dosage: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    frequency: { type: String, required: true },
    timings: {
      morning: { type: Boolean, default: false },
      afternoon: { type: Boolean, default: false },
      evening: { type: Boolean, default: false },
      night: { type: Boolean, default: false },
    },
    foodInstruction: { type: String, default: "After Food" },
    foodInstructionRaw: { type: String },
    duration: { type: String },
    reminderTimes: [{ type: String }],
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    notes: { type: String },
    status: { type: String, enum: ["active", "inactive", "completed"], default: "active" },
  },
  { timestamps: true }
);

MedicineSchema.index({ userId: 1, medicineName: "text", genericName: "text" });

export default models.Medicine || mongoose.model("Medicine", MedicineSchema);
