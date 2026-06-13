import mongoose, { Schema, models } from "mongoose";

const AppointmentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    hospitalId: { type: Schema.Types.ObjectId, ref: "Hospital", required: true, index: true },
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true, index: true },
    appointmentDate: { type: Date, required: true, index: true },
    slotTime: { type: String, required: true },
    status: {
      type: String,
      enum: ["BOOKED", "COMPLETED", "CANCELLED"],
      default: "BOOKED",
    },
    notes: { type: String },
    consultationFee: { type: Number, default: 0 },
    paymentMethod: {
      type: String,
      enum: ["UPI", "PAY_AT_HOSPITAL"],
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "COMPLETED"],
      default: "PENDING",
    },
    paymentReceiptId: { type: String },
    upiTransactionId: { type: String },
    paidAt: { type: Date },
    patientDetails: {
      name: { type: String },
      gender: { type: String, enum: ["Male", "Female", "Other"] },
      dateOfBirth: { type: Date },
      height: { type: Number },
      weight: { type: Number },
      diseaseName: { type: String },
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AppointmentSchema.index(
  { doctorId: 1, appointmentDate: 1, slotTime: 1 },
  { unique: true, partialFilterExpression: { status: "BOOKED" } }
);

export default models.Appointment || mongoose.model("Appointment", AppointmentSchema);
