import type { IMedicine, IMedicineTimings, IReminder } from "@/types";

export const DOSE_SLOTS = ["morning", "afternoon", "night"] as const;

export type DoseSlot = (typeof DOSE_SLOTS)[number];

export const DOSE_SLOT_LABELS: Record<DoseSlot, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  night: "Night",
};

const SLOT_ORDER: (keyof IMedicineTimings)[] = ["morning", "afternoon", "evening", "night"];

export function getActiveDoseSlots(timings?: IMedicineTimings): (keyof IMedicineTimings)[] {
  if (!timings) return [];
  return SLOT_ORDER.filter((slot) => timings[slot]);
}

/** Map evening slot to Night filter tab (Indian 1-0-1 uses night, not evening) */
export function normalizeDoseSlot(slot: string): DoseSlot | "evening" {
  if (slot === "evening") return "night";
  if (slot === "morning" || slot === "afternoon" || slot === "night") return slot;
  return "morning";
}

export function getReminderDoseSlot(reminder: IReminder): DoseSlot {
  if (reminder.doseSlot) {
    return normalizeDoseSlot(reminder.doseSlot) as DoseSlot;
  }

  const medicine =
    typeof reminder.medicineId === "object" ? (reminder.medicineId as IMedicine) : null;

  if (medicine?.timings) {
    const slots = getActiveDoseSlots(medicine.timings);
    const times = medicine.reminderTimes ?? [];

    const idx = times.indexOf(reminder.reminderTime);
    if (idx >= 0 && slots[idx]) {
      return normalizeDoseSlot(slots[idx]) as DoseSlot;
    }

    if (slots.length === 1) {
      return normalizeDoseSlot(slots[0]) as DoseSlot;
    }
  }

  return inferDoseSlotFromClock(reminder.reminderTime);
}

function inferDoseSlotFromClock(time: string): DoseSlot {
  const [hours] = time.split(":").map(Number);
  const h = hours ?? 0;

  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  return "night";
}

export function matchesDoseSlot(reminder: IReminder, filter: DoseSlot | "all"): boolean {
  if (filter === "all") return true;
  return getReminderDoseSlot(reminder) === filter;
}
