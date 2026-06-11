import mongoose from "mongoose";
import Prescription from "@/models/Prescription";
import Medicine from "@/models/Medicine";
import Reminder from "@/models/Reminder";
import Inventory from "@/models/Inventory";

export async function deletePrescriptionWithDependents(userId: string, prescriptionId: string) {
  const prescription = await Prescription.findOne({ _id: prescriptionId, userId });
  if (!prescription) return null;

  const medicineIds = (prescription.medicineIds ?? []).map((id: mongoose.Types.ObjectId) =>
    id.toString()
  );

  if (medicineIds.length > 0) {
    const objectIds = medicineIds
      .filter((id: string) => mongoose.Types.ObjectId.isValid(id))
      .map((id: string) => new mongoose.Types.ObjectId(id));

    await Promise.all([
      Reminder.deleteMany({ userId, medicineId: { $in: objectIds } }),
      Inventory.deleteMany({ userId, medicineId: { $in: objectIds } }),
      Medicine.deleteMany({ _id: { $in: objectIds }, userId }),
    ]);
  }

  await Prescription.findByIdAndDelete(prescription._id);

  return {
    prescription,
    medicinesRemoved: medicineIds.length,
  };
}
