import { apiHandler, successResponse } from "@/lib/api-helpers";
import Medicine from "@/models/Medicine";
import Prescription from "@/models/Prescription";
import type { IMedicine } from "@/types";

export interface MedicineGroup {
  prescriptionId: string;
  prescriptionName: string;
  uploadedAt: Date;
  imageUrl: string;
  medicines: IMedicine[];
}

export const GET = apiHandler(async (userId, request) => {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";

  const medicineFilter: Record<string, unknown> = { userId };
  if (status) medicineFilter.status = status;
  if (search) {
    medicineFilter.$or = [
      { medicineName: { $regex: search, $options: "i" } },
      { genericName: { $regex: search, $options: "i" } },
    ];
  }

  const [prescriptions, medicines] = await Promise.all([
    Prescription.find({ userId, medicineIds: { $exists: true, $ne: [] } }).sort({ uploadedAt: -1 }),
    Medicine.find(medicineFilter).sort({ createdAt: -1 }),
  ]);

  const medicineMap = new Map(medicines.map((m) => [m._id.toString(), m]));
  const groupedIds = new Set<string>();

  const groups: MedicineGroup[] = prescriptions
    .map((prescription) => {
      const groupMedicines = (prescription.medicineIds || [])
        .map((id) => medicineMap.get(id.toString()))
        .filter((medicine): medicine is IMedicine => Boolean(medicine));

      groupMedicines.forEach((medicine) => groupedIds.add(medicine._id.toString()));

      return {
        prescriptionId: prescription._id.toString(),
        prescriptionName: prescription.fileName,
        uploadedAt: prescription.uploadedAt,
        imageUrl: prescription.imageUrl,
        medicines: groupMedicines,
      };
    })
    .filter((group) => group.medicines.length > 0);

  const ungrouped = medicines.filter((medicine) => !groupedIds.has(medicine._id.toString()));

  return successResponse({ groups, ungrouped, total: medicines.length });
});
