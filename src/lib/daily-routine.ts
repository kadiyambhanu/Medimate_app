import { z } from "zod";

export const DEFAULT_DAILY_ROUTINE = {
  wakeUp: "06:00",
  breakfast: "08:00",
  lunch: "13:00",
  dinner: "20:00",
  sleep: "22:00",
} as const;

export type DailyRoutine = {
  wakeUp: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  sleep: string;
};

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const dailyRoutineSchema = z.object({
  wakeUp: z.string().regex(timeRegex, "Invalid wake-up time"),
  breakfast: z.string().regex(timeRegex, "Invalid breakfast time"),
  lunch: z.string().regex(timeRegex, "Invalid lunch time"),
  dinner: z.string().regex(timeRegex, "Invalid dinner time"),
  sleep: z.string().regex(timeRegex, "Invalid sleep time"),
});

export function hasDailyRoutine(routine?: DailyRoutine | null): boolean {
  if (!routine) return false;
  return Boolean(
    routine.wakeUp &&
      routine.breakfast &&
      routine.lunch &&
      routine.dinner &&
      routine.sleep
  );
}

export function mergeDailyRoutine(routine?: Partial<DailyRoutine> | null): DailyRoutine {
  return {
    wakeUp: routine?.wakeUp || DEFAULT_DAILY_ROUTINE.wakeUp,
    breakfast: routine?.breakfast || DEFAULT_DAILY_ROUTINE.breakfast,
    lunch: routine?.lunch || DEFAULT_DAILY_ROUTINE.lunch,
    dinner: routine?.dinner || DEFAULT_DAILY_ROUTINE.dinner,
    sleep: routine?.sleep || DEFAULT_DAILY_ROUTINE.sleep,
  };
}
