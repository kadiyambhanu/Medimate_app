import mongoose, { Schema, models } from "mongoose";

const InventorySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    medicineId: { type: Schema.Types.ObjectId, ref: "Medicine", required: true, index: true },
    medicineName: { type: String, required: true, trim: true },
    currentStock: { type: Number, required: true, min: 0, default: 0 },
    unit: { type: String, default: "tablets" },
    lowStockThreshold: { type: Number, required: true, min: 1, default: 10 },
    lastRestockedAt: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

InventorySchema.index({ userId: 1, medicineId: 1 }, { unique: true });

export default models.Inventory || mongoose.model("Inventory", InventorySchema);
