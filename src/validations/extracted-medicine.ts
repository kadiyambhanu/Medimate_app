import { z } from "zod";
import { FOOD_INSTRUCTION_VALUES } from "@/lib/food-instructions";
import { dailyRoutineSchema } from "@/lib/daily-routine";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const extractedMedicineSchema = z.object({
  medicineName: z.string().min(1, "Medicine name is required"),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  duration: z.string().optional(),
  foodInstruction: z.enum(FOOD_INSTRUCTION_VALUES).optional(),
  foodInstructionRaw: z.string().optional(),
  morning: z.boolean().default(false),
  afternoon: z.boolean().default(false),
  evening: z.boolean().default(false),
  night: z.boolean().default(false),
  beforeFood: z.boolean().default(false),
  afterFood: z.boolean().default(false),
  reminderTimes: z.array(z.string().regex(timeRegex)).optional(),
  notes: z.string().optional(),
});

export const bulkCreateMedicinesSchema = z.object({
  prescriptionId: z.string().optional(),
  medicines: z.array(extractedMedicineSchema).min(1, "At least one medicine is required"),
  startDate: z.string().optional(),
  scheduleDays: z.number().min(1).max(90).optional(),
  dailyRoutine: dailyRoutineSchema.optional(),
});

export type ExtractedMedicine = z.infer<typeof extractedMedicineSchema>;
export type BulkCreateMedicinesInput = z.infer<typeof bulkCreateMedicinesSchema>;
