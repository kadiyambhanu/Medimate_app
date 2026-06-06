import { addMinutes, parse, format } from "date-fns";
import type { DailyRoutine } from "@/lib/daily-routine";
import {
  type FoodInstruction,
  foodInstructionFromLegacy,
  normalizeFoodInstruction,
} from "@/lib/food-instructions";
import type { ExtractedMedicine } from "@/validations/extracted-medicine";
import type { IMedicineTimings } from "@/types";

const BEFORE_MEAL_MINUTES = 30;
const AFTER_MEAL_MINUTES = 30;
const BEFORE_SLEEP_MINUTES = 30;

type TimingSlot = keyof IMedicineTimings;

function parseTime(time: string): Date {
  return parse(time, "HH:mm", new Date());
}

function formatTime(date: Date): string {
  return format(date, "HH:mm");
}

function addToTime(time: string, minutes: number): string {
  return formatTime(addMinutes(parseTime(time), minutes));
}

function subtractFromTime(time: string, minutes: number): string {
  return formatTime(addMinutes(parseTime(time), -minutes));
}

function midpointTime(start: string, end: string): string {
  const startMs = parseTime(start).getTime();
  const endMs = parseTime(end).getTime();
  return formatTime(new Date(startMs + (endMs - startMs) / 2));
}

function getActiveSlots(medicine: ExtractedMedicine): TimingSlot[] {
  const slots: TimingSlot[] = [];
  if (medicine.morning) slots.push("morning");
  if (medicine.afternoon) slots.push("afternoon");
  if (medicine.evening) slots.push("evening");
  if (medicine.night) slots.push("night");
  if (slots.length === 0) slots.push("morning");
  return slots;
}

function resolveFoodInstruction(medicine: ExtractedMedicine): FoodInstruction {
  const normalized =
    normalizeFoodInstruction(medicine.foodInstruction) ??
    normalizeFoodInstruction(medicine.foodInstructionRaw);
  if (normalized) return normalized;
  return foodInstructionFromLegacy(medicine.beforeFood, medicine.afterFood);
}

function slotMealTime(slot: TimingSlot, routine: DailyRoutine): string {
  switch (slot) {
    case "morning":
      return routine.breakfast;
    case "afternoon":
      return routine.lunch;
    case "evening":
      return midpointTime(routine.lunch, routine.dinner);
    case "night":
      return routine.dinner;
  }
}

function slotMatchesInstruction(slot: TimingSlot, instruction: FoodInstruction): boolean {
  switch (instruction) {
    case "before_breakfast":
    case "after_breakfast":
      return slot === "morning";
    case "before_lunch":
    case "after_lunch":
      return slot === "afternoon";
    case "before_dinner":
    case "after_dinner":
      return slot === "evening" || slot === "night";
    case "before_sleep":
      return slot === "night";
    case "empty_stomach":
      return slot === "morning";
    case "before_food":
    case "after_food":
      return false;
    default:
      return true;
  }
}

function timeForSpecificInstruction(
  instruction: FoodInstruction,
  routine: DailyRoutine
): string {
  switch (instruction) {
    case "before_breakfast":
      return subtractFromTime(routine.breakfast, BEFORE_MEAL_MINUTES);
    case "after_breakfast":
      return addToTime(routine.breakfast, AFTER_MEAL_MINUTES);
    case "before_lunch":
      return subtractFromTime(routine.lunch, BEFORE_MEAL_MINUTES);
    case "after_lunch":
      return addToTime(routine.lunch, AFTER_MEAL_MINUTES);
    case "before_dinner":
      return subtractFromTime(routine.dinner, BEFORE_MEAL_MINUTES);
    case "after_dinner":
      return addToTime(routine.dinner, AFTER_MEAL_MINUTES);
    case "before_sleep":
      return subtractFromTime(routine.sleep, BEFORE_SLEEP_MINUTES);
    case "empty_stomach":
      return routine.wakeUp;
    case "before_food":
      return subtractFromTime(routine.breakfast, BEFORE_MEAL_MINUTES);
    case "after_food":
      return addToTime(routine.breakfast, AFTER_MEAL_MINUTES);
  }
}

function timeForSlot(
  slot: TimingSlot,
  instruction: FoodInstruction,
  routine: DailyRoutine
): string {
  if (slotMatchesInstruction(slot, instruction)) {
    return timeForSpecificInstruction(instruction, routine);
  }

  const mealTime = slotMealTime(slot, routine);

  if (instruction === "before_food" || instruction.startsWith("before_")) {
    return subtractFromTime(mealTime, BEFORE_MEAL_MINUTES);
  }

  if (instruction === "after_food" || instruction.startsWith("after_")) {
    return addToTime(mealTime, AFTER_MEAL_MINUTES);
  }

  if (instruction === "empty_stomach") {
    return slot === "morning" ? routine.wakeUp : addToTime(mealTime, AFTER_MEAL_MINUTES);
  }

  if (instruction === "before_sleep") {
    return slot === "night"
      ? subtractFromTime(routine.sleep, BEFORE_SLEEP_MINUTES)
      : addToTime(mealTime, AFTER_MEAL_MINUTES);
  }

  return addToTime(mealTime, AFTER_MEAL_MINUTES);
}

export function parseDurationDays(duration?: string): number | undefined {
  if (!duration?.trim()) return undefined;
  const text = duration.trim().toLowerCase();

  const dayMatch = text.match(/(\d+)\s*days?/);
  if (dayMatch) return Number(dayMatch[1]);

  const weekMatch = text.match(/(\d+)\s*weeks?/);
  if (weekMatch) return Number(weekMatch[1]) * 7;

  const monthMatch = text.match(/(\d+)\s*months?/);
  if (monthMatch) return Number(monthMatch[1]) * 30;

  return undefined;
}

export function generateReminderSchedule(
  medicine: ExtractedMedicine,
  routine: DailyRoutine
): { slot: TimingSlot; time: string }[] {
  const instruction = resolveFoodInstruction(medicine);
  const slots = getActiveSlots(medicine);

  return slots.map((slot) => ({
    slot,
    time: timeForSlot(slot, instruction, routine),
  }));
}

export function resolveReminderSchedule(
  medicine: ExtractedMedicine,
  routine: DailyRoutine
): { slot: TimingSlot; time: string }[] {
  const baseSchedule = generateReminderSchedule(medicine, routine);

  if (!medicine.reminderTimes?.length) {
    return baseSchedule;
  }

  const slots = getActiveSlots(medicine);
  return slots.map((slot, index) => ({
    slot,
    time:
      medicine.reminderTimes![index] ??
      baseSchedule.find((entry) => entry.slot === slot)?.time ??
      "08:00",
  }));
}

export function generateReminderTimes(
  medicine: ExtractedMedicine,
  routine: DailyRoutine
): string[] {
  return resolveReminderSchedule(medicine, routine).map((entry) => entry.time);
}

export function enrichMedicineWithSchedule(
  medicine: ExtractedMedicine,
  routine: DailyRoutine
): ExtractedMedicine {
  return {
    ...medicine,
    foodInstruction: resolveFoodInstruction(medicine),
    reminderTimes: medicine.reminderTimes?.length
      ? medicine.reminderTimes
      : generateReminderTimes(medicine, routine),
  };
}
