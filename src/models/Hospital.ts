import mongoose, { Schema, models } from "mongoose";

const HospitalSchema = new Schema(
  {
    hospitalName: { type: String, required: true, trim: true },
    logo: { type: String },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String },
    address: { type: String, required: true },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    description: { type: String },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    role: { type: String, enum: ["HOSPITAL"], default: "HOSPITAL" },
  },
  { timestamps: true }
);

export default models.Hospital || mongoose.model("Hospital", HospitalSchema);
