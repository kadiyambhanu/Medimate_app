import { addDays, format } from "date-fns";
import Medicine from "@/models/Medicine";
import Reminder from "@/models/Reminder";
import Prescription from "@/models/Prescription";
import Notification from "@/models/Notification";
import User from "@/models/User";
import { REMINDER_SCHEDULE_DAYS } from "@/lib/constants";
import { mergeDailyRoutine, type DailyRoutine } from "@/lib/daily-routine";
import { foodInstructionLabel } from "@/lib/food-instructions";
import {
  enrichMedicineWithSchedule,
  parseDurationDays,
  resolveReminderSchedule,
} from "@/services/reminder-schedule.service";
import type { ExtractedMedicine } from "@/validations/extracted-medicine";
import type { IMedicineTimings, IMedicine } from "@/types";

function deriveFrequency(timings: IMedicineTimings, fallback?: string): string {
  if (fallback?.trim()) return fallback;

  const count = [timings.morning, timings.afternoon, timings.evening, timings.night].filter(
    Boolean
  ).length;

  if (count === 0) return "Once Daily";
  if (count === 1) return "Once Daily";
  if (count === 2) return "Twice Daily";
  if (count === 3) return "Thrice Daily";
  return "Four Times Daily";
}

function toTimings(extracted: ExtractedMedicine): IMedicineTimings {
  return {
    morning: extracted.morning,
    afternoon: extracted.afternoon,
    evening: extracted.evening,
    night: extracted.night,
  };
}

function deriveFoodInstruction(extracted: ExtractedMedicine): string {
  if (extracted.foodInstructionRaw?.trim()) {
    return extracted.foodInstructionRaw.trim();
  }
  return foodInstructionLabel(extracted.foodInstruction);
}

function buildMedicineDoc(
  userId: string,
  extracted: ExtractedMedicine,
  startDate: Date,
  endDate?: Date
): Record<string, unknown> {
  const timings = toTimings(extracted);
  if (!Object.values(timings).some(Boolean)) {
    timings.morning = true;
  }

  return {
    userId,
    medicineName: extracted.medicineName,
    dosage: extracted.dosage || "As prescribed",
    quantity: 1,
    frequency: deriveFrequency(timings, extracted.frequency),
    timings,
    foodInstruction: deriveFoodInstruction(extracted),
    foodInstructionRaw: extracted.foodInstructionRaw,
    duration: extracted.duration,
    reminderTimes: extracted.reminderTimes ?? [],
    startDate,
    endDate,
    notes: extracted.notes,
    status: "active",
  };
}

async function resolveDailyRoutine(
  userId: string,
  routineOverride?: DailyRoutine
): Promise<DailyRoutine> {
  if (routineOverride) return mergeDailyRoutine(routineOverride);

  const user = await User.findById(userId).select("dailyRoutine");
  return mergeDailyRoutine(user?.dailyRoutine ?? undefined);
}

export interface BulkCreateResult {
  medicines: IMedicine[];
  remindersCreated: number;
  prescriptionId?: string;
}

export async function bulkCreateMedicines(
  userId: string,
  extractedMedicines: ExtractedMedicine[],
  options?: { startDate?: string; dailyRoutine?: DailyRoutine }
): Promise<IMedicine[]> {
  const startDate = options?.startDate ? new Date(options.startDate) : new Date();
  startDate.setHours(0, 0, 0, 0);

  const routine = await resolveDailyRoutine(userId, options?.dailyRoutine);
  const prepared = extractedMedicines.map((medicine) => enrichMedicineWithSchedule(medicine, routine));

  const docs = prepared.map((medicine) => {
    const durationDays = parseDurationDays(medicine.duration);
    const endDate = durationDays ? addDays(startDate, durationDays - 1) : undefined;
    return buildMedicineDoc(userId, medicine, startDate, endDate);
  });

  return Medicine.insertMany(docs) as Promise<IMedicine[]>;
}

export async function scheduleRemindersForMedicines(
  userId: string,
  medicines: IMedicine[],
  extractedMedicines: ExtractedMedicine[],
  options?: { startDate?: string; scheduleDays?: number; dailyRoutine?: DailyRoutine }
): Promise<number> {
  const startDate = options?.startDate ? new Date(options.startDate) : new Date();
  startDate.setHours(0, 0, 0, 0);
  const routine = await resolveDailyRoutine(userId, options?.dailyRoutine);

  const allReminders: Record<string, unknown>[] = [];

  for (let i = 0; i < medicines.length; i++) {
    const medicine = medicines[i];
    const extracted = enrichMedicineWithSchedule(extractedMedicines[i], routine);
    const schedule = resolveReminderSchedule(extracted, routine);

    if (schedule.length === 0) continue;

    const durationDays = parseDurationDays(extracted.duration);
    const scheduleDays = durationDays ?? options?.scheduleDays ?? REMINDER_SCHEDULE_DAYS;

    for (let day = 0; day < scheduleDays; day++) {
      const scheduledDate = addDays(startDate, day);
      for (const { slot, time } of schedule) {
        allReminders.push({
          userId,
          medicineId: medicine._id,
          reminderTime: time,
          doseSlot: slot,
          scheduledDate,
          status: "pending",
          notes: extracted.notes,
        });
      }
    }
  }

  if (allReminders.length > 0) {
    await Reminder.insertMany(allReminders, { ordered: false });
  }

  return allReminders.length;
}

export async function bulkCreateMedicinesAndReminders(
  userId: string,
  extractedMedicines: ExtractedMedicine[],
  options?: {
    prescriptionId?: string;
    startDate?: string;
    scheduleDays?: number;
    dailyRoutine?: DailyRoutine;
  }
): Promise<BulkCreateResult> {
  const startDate = options?.startDate ? new Date(options.startDate) : new Date();
  startDate.setHours(0, 0, 0, 0);

  if (options?.dailyRoutine) {
    await User.findByIdAndUpdate(userId, { dailyRoutine: options.dailyRoutine });
  }

  const routine = await resolveDailyRoutine(userId, options?.dailyRoutine);
  const prepared = extractedMedicines.map((medicine) => enrichMedicineWithSchedule(medicine, routine));

  const createdMedicines = await bulkCreateMedicines(userId, prepared, options);
  const remindersCreated = await scheduleRemindersForMedicines(
    userId,
    createdMedicines,
    prepared,
    options
  );

  if (options?.prescriptionId) {
    await Prescription.findOneAndUpdate(
      { _id: options.prescriptionId, userId },
      { medicineIds: createdMedicines.map((m) => m._id), ocrStatus: "applied" }
    );
  }

  const todayLabel = format(startDate, "MMM d, yyyy");
  await Notification.create({
    userId,
    title: "Prescription Applied",
    message: `${createdMedicines.length} medicine(s) added from your prescription with ${remindersCreated} reminders scheduled from ${todayLabel}.`,
    type: "system",
  });

  return { medicines: createdMedicines, remindersCreated, prescriptionId: options?.prescriptionId };
}
