import mongoose, { Schema, models } from "mongoose";

const FamilyMemberSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    memberName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    relation: { type: String, required: true },
  },
  { timestamps: true }
);

export default models.FamilyMember || mongoose.model("FamilyMember", FamilyMemberSchema);
