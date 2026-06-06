import type { IExtractedMedicine } from "@/types";
import type { ExtractedMedicine } from "@/validations/extracted-medicine";
import { applyFrequencyPattern } from "@/lib/frequency-pattern";

export function normalizeExtractedMedicine(med: IExtractedMedicine): ExtractedMedicine {
  return applyFrequencyPattern({
    medicineName: med.medicineName,
    dosage: med.dosage,
    morning: med.morning ?? false,
    afternoon: med.afternoon ?? false,
    evening: med.evening ?? false,
    night: med.night ?? false,
    beforeFood: med.beforeFood ?? false,
    afterFood: med.afterFood ?? false,
    frequency: med.frequency,
    notes: med.notes,
  });
}

export function normalizeExtractedMedicines(meds: IExtractedMedicine[]): ExtractedMedicine[] {
  return meds.map(normalizeExtractedMedicine);
}
