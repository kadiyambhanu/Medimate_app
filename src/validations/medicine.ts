import { z } from "zod";

export const medicineSchema = z.object({
  medicineName: z.string().min(1, "Medicine name is required"),
  genericName: z.string().optional(),
  dosage: z.string().min(1, "Dosage is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  frequency: z.string().min(1, "Frequency is required"),
  timings: z.object({
    morning: z.boolean(),
    afternoon: z.boolean(),
    evening: z.boolean(),
    night: z.boolean(),
  }),
  foodInstruction: z.string().min(1),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["active", "inactive", "completed"]),
});

export type MedicineInput = z.infer<typeof medicineSchema>;
