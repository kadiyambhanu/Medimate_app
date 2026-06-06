import { addDays, endOfDay, startOfDay } from "date-fns";
import Medicine from "@/models/Medicine";
import Reminder from "@/models/Reminder";
import User from "@/models/User";
import { REMINDER_SCHEDULE_DAYS } from "@/lib/constants";
import { mergeDailyRoutine } from "@/lib/daily-routine";
import { normalizeFoodInstruction } from "@/lib/food-instructions";
import { getActiveDoseSlots } from "@/lib/time-period";
import {
  parseDurationDays,
  resolveReminderSchedule,
} from "@/services/reminder-schedule.service";
import type { IMedicine } from "@/types";
import type { ExtractedMedicine } from "@/validations/extracted-medicine";

function medicineToExtracted(medicine: IMedicine): ExtractedMedicine {
  const foodInstruction =
    normalizeFoodInstruction(medicine.foodInstructionRaw ?? medicine.foodInstruction) ?? undefined;

  return {
    medicineName: medicine.medicineName,
    dosage: medicine.dosage,
    frequency: medicine.frequency,
    duration: medicine.duration,
    foodInstruction,
    foodInstructionRaw: medicine.foodInstructionRaw ?? medicine.foodInstruction,
    morning: medicine.timings.morning,
    afternoon: medicine.timings.afternoon,
    evening: medicine.timings.evening,
    night: medicine.timings.night,
    beforeFood: Boolean(foodInstruction?.startsWith("before_") || foodInstruction === "empty_stomach"),
    afterFood: Boolean(foodInstruction?.startsWith("after_")),
    reminderTimes: medicine.reminderTimes,
    notes: medicine.notes,
  };
}

async function backfillDoseSlots(userId: string, date: Date): Promise<void> {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  const reminders = await Reminder.find({
    userId,
    scheduledDate: { $gte: dayStart, $lte: dayEnd },
    $or: [{ doseSlot: { $exists: false } }, { doseSlot: null }],
  }).populate("medicineId");

  const grouped = new Map<string, (typeof reminders)[number][]>();

  for (const reminder of reminders) {
    const medicine = reminder.medicineId as IMedicine;
    if (!medicine?._id) continue;
    const key = medicine._id.toString();
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(reminder);
  }

  for (const group of grouped.values()) {
    const medicine = group[0].medicineId as IMedicine;
    const slots = getActiveDoseSlots(medicine.timings);
    const sorted = [...group].sort((a, b) => a.reminderTime.localeCompare(b.reminderTime));

    await Promise.all(
      sorted.map(async (reminder, index) => {
        const slot = slots[index];
        if (slot) {
          reminder.doseSlot = slot;
          await reminder.save();
        }
      })
    );
  }
}

/** Create missing dose reminders for active medicines on a given date */
export async function syncRemindersForDate(userId: string, date: Date): Promise<number> {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  const [medicines, user] = await Promise.all([
    Medicine.find({ userId, status: "active" }),
    User.findById(userId).select("dailyRoutine"),
  ]);

  const routine = mergeDailyRoutine(user?.dailyRoutine ?? undefined);
  let created = 0;

  for (const medicine of medicines) {
    const medStart = startOfDay(new Date(medicine.startDate));
    if (dayStart < medStart) continue;
    if (medicine.endDate && dayStart > startOfDay(new Date(medicine.endDate))) continue;

    const schedule = resolveReminderSchedule(medicineToExtracted(medicine), routine);
    if (schedule.length === 0) continue;

    for (const { slot, time } of schedule) {
      const bySlot = await Reminder.findOne({
        userId,
        medicineId: medicine._id,
        scheduledDate: { $gte: dayStart, $lte: dayEnd },
        doseSlot: slot,
      });

      if (bySlot) continue;

      const legacy = await Reminder.findOne({
        userId,
        medicineId: medicine._id,
        scheduledDate: { $gte: dayStart, $lte: dayEnd },
        reminderTime: time,
      });

      if (legacy) {
        if (!legacy.doseSlot) {
          legacy.doseSlot = slot;
          await legacy.save();
        }
        continue;
      }

      await Reminder.create({
        userId,
        medicineId: medicine._id,
        reminderTime: time,
        doseSlot: slot,
        scheduledDate: dayStart,
        status: "pending",
      });
      created++;
    }
  }

  await backfillDoseSlots(userId, date);
  return created;
}

/** Ensure upcoming reminders exist for all active medicine dose slots */
export async function syncUpcomingReminders(userId: string): Promise<number> {
  const today = startOfDay(new Date());
  let created = 0;

  for (let offset = 0; offset < REMINDER_SCHEDULE_DAYS; offset++) {
    created += await syncRemindersForDate(userId, addDays(today, offset));
  }

  return created;
}
