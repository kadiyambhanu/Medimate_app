import { z } from "zod";

export const reminderSchema = z.object({
  medicineId: z.string().min(1, "Medicine is required"),
  reminderTime: z.string().min(1, "Time is required"),
  notes: z.string().optional(),
  scheduledDate: z.string().min(1, "Date is required"),
});

export const reminderStatusSchema = z.object({
  status: z.enum(["pending", "taken", "missed", "snoozed"]),
  notes: z.string().optional(),
});

export type ReminderInput = z.infer<typeof reminderSchema>;
export type ReminderStatusInput = z.infer<typeof reminderStatusSchema>;
