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
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AppointmentSchema.index(
  { doctorId: 1, appointmentDate: 1, slotTime: 1 },
  { unique: true, partialFilterExpression: { status: "BOOKED" } }
);

export default models.Appointment || mongoose.model("Appointment", AppointmentSchema);
