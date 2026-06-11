import {
  getReminderDoseSlot,
  getScheduledTimeForSlot,
  medicineMatchesDoseSlot,
  type DoseSlot,
} from "@/lib/time-period";
import type { IMedicine, IReminder } from "@/types";

export interface MedicineReminderEntry {
  medicine: IMedicine;
  reminders: IReminder[];
  scheduledTime: string | null;
}

export function getMedicineRecordId(medicineId: IReminder["medicineId"] | IMedicine): string {
  if (typeof medicineId === "string") return medicineId;
  if (medicineId && typeof medicineId === "object" && "_id" in medicineId) {
    return medicineId._id.toString();
  }
  return "";
}

export function resolveMedicine(
  reminder: IReminder,
  medicineLookup: Map<string, IMedicine>
): IMedicine | null {
  const populated =
    typeof reminder.medicineId === "object" && reminder.medicineId !== null
      ? (reminder.medicineId as IMedicine)
      : null;

  if (populated?.medicineName) {
    return populated;
  }

  const id = getMedicineRecordId(reminder.medicineId);
  return id ? medicineLookup.get(id) ?? populated : populated;
}

export function buildMedicineLookup(medicines: IMedicine[]): Map<string, IMedicine> {
  return new Map(medicines.map((medicine) => [medicine._id.toString(), medicine]));
}

export function groupRemindersByMedicine(
  reminders: IReminder[],
  medicineLookup: Map<string, IMedicine>
): Array<{ medicine: IMedicine; reminders: IReminder[] }> {
  const groups = new Map<string, { medicine: IMedicine; reminders: IReminder[] }>();

  for (const reminder of reminders) {
    const medicine = resolveMedicine(reminder, medicineLookup);
    if (!medicine?.medicineName) continue;

    const key = getMedicineRecordId(medicine);
    if (!groups.has(key)) {
      groups.set(key, { medicine, reminders: [] });
    }
    groups.get(key)!.reminders.push(reminder);
  }

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      reminders: [...group.reminders].sort((a, b) => a.reminderTime.localeCompare(b.reminderTime)),
    }))
    .sort((a, b) => a.medicine.medicineName.localeCompare(b.medicine.medicineName));
}

function reminderBelongsToMedicine(
  reminder: IReminder,
  medicine: IMedicine,
  medicineLookup: Map<string, IMedicine>
): boolean {
  const resolved = resolveMedicine(reminder, medicineLookup);
  return getMedicineRecordId(resolved ?? medicine) === medicine._id.toString();
}

/** Build reminder rows from medicines + timings (morning / afternoon / night tabs). */
export function buildMedicineReminderEntries(
  medicines: IMedicine[],
  reminders: IReminder[],
  medicineLookup: Map<string, IMedicine>,
  slot: DoseSlot | "all"
): MedicineReminderEntry[] {
  const sourceMedicines =
    slot === "all" ? medicines : medicines.filter((medicine) => medicineMatchesDoseSlot(medicine, slot));

  return sourceMedicines
    .map((medicine) => {
      const medicineReminders = reminders
        .filter((reminder) => reminderBelongsToMedicine(reminder, medicine, medicineLookup))
        .filter((reminder) => slot === "all" || getReminderDoseSlot(reminder) === slot)
        .sort((a, b) => a.reminderTime.localeCompare(b.reminderTime));

      const scheduledTime =
        slot === "all"
          ? null
          : medicineReminders[0]?.reminderTime ?? getScheduledTimeForSlot(medicine, slot);

      return {
        medicine,
        reminders: medicineReminders,
        scheduledTime,
      };
    })
    .sort((a, b) => a.medicine.medicineName.localeCompare(b.medicine.medicineName));
}
