import mongoose, { Schema, models } from "mongoose";

const DoctorSchema = new Schema(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: "Hospital", required: true, index: true },
    name: { type: String, required: true, trim: true },
    profileImage: { type: String },
    specialization: { type: String, required: true },
    qualification: { type: String },
    experience: { type: Number, default: 0 },
    consultationFee: { type: Number, default: 0 },
    description: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default models.Doctor || mongoose.model("Doctor", DoctorSchema);
