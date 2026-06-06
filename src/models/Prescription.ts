import mongoose, { Schema, models } from "mongoose";

const ExtractedMedicineSchema = new Schema(
  {
    medicineName: { type: String, required: true },
    dosage: { type: String },
    frequency: { type: String },
    duration: { type: String },
    foodInstruction: { type: String },
    foodInstructionRaw: { type: String },
    morning: { type: Boolean, default: false },
    afternoon: { type: Boolean, default: false },
    evening: { type: Boolean, default: false },
    night: { type: Boolean, default: false },
    beforeFood: { type: Boolean, default: false },
    afterFood: { type: Boolean, default: false },
    reminderTimes: [{ type: String }],
    notes: { type: String },
  },
  { _id: false }
);

const PrescriptionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    imageUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    extractedText: { type: String },
    extractedMedicines: { type: [ExtractedMedicineSchema], default: [] },
    ocrStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "applied"],
      default: "pending",
    },
    ocrProvider: { type: String },
    ocrError: { type: String },
    medicineIds: [{ type: Schema.Types.ObjectId, ref: "Medicine" }],
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default models.Prescription || mongoose.model("Prescription", PrescriptionSchema);
