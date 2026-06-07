import { addMinutes, format, parse } from "date-fns";
import type { IDoctorSchedule } from "@/types";

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function parseTime(time: string): Date {
  return parse(time, "HH:mm", new Date());
}

function formatTime(date: Date): string {
  return format(date, "HH:mm");
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function getDayName(date: Date): string {
  return DAY_NAMES[date.getDay()];
}

export function generateSlotsFromSchedule(
  schedule: Pick<IDoctorSchedule, "startTime" | "endTime" | "slotDuration" | "breakTime" | "availableDays">,
  date: Date
): string[] {
  const dayName = getDayName(date);
  if (!schedule.availableDays.includes(dayName)) {
    return [];
  }

  const slots: string[] = [];
  const startMinutes = timeToMinutes(schedule.startTime);
  const endMinutes = timeToMinutes(schedule.endTime);
  const breakStart = schedule.breakTime ? timeToMinutes(schedule.breakTime) : null;
  const breakEnd = breakStart !== null ? breakStart + schedule.slotDuration : null;

  let current = startMinutes;
  while (current + schedule.slotDuration <= endMinutes) {
    const slotEnd = current + schedule.slotDuration;

    if (breakStart !== null && breakEnd !== null) {
      const overlapsBreak = current < breakEnd && slotEnd > breakStart;
      if (overlapsBreak) {
        current = breakEnd;
        continue;
      }
    }

    const hours = Math.floor(current / 60);
    const mins = current % 60;
    slots.push(`${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`);
    current += schedule.slotDuration;
  }

  return slots;
}

export function isSlotInPast(date: Date, slotTime: string): boolean {
  const now = new Date();
  const slotDate = parse(slotTime, "HH:mm", new Date(date));
  slotDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
  return slotDate < now;
}

export function normalizeAppointmentDate(dateInput: string): Date {
  const date = new Date(dateInput);
  date.setHours(0, 0, 0, 0);
  return date;
}
