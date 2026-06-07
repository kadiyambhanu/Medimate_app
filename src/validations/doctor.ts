import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

export const doctorScheduleSchema = z.object({
  availableDays: z.array(z.enum(days)).min(1, "Select at least one day"),
  startTime: z.string().regex(timeRegex, "Invalid start time"),
  endTime: z.string().regex(timeRegex, "Invalid end time"),
  slotDuration: z.number().min(10).max(120),
  breakTime: z.string().regex(timeRegex, "Invalid break time").optional().or(z.literal("")),
});

export const doctorSchema = z.object({
  hospitalId: z.string().min(1, "Hospital is required"),
  name: z.string().min(2, "Doctor name is required"),
  profileImage: z.string().optional(),
  specialization: z.string().min(2, "Specialization is required"),
  qualification: z.string().optional(),
  experience: z.number().min(0).optional(),
  consultationFee: z.number().min(0).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  schedule: doctorScheduleSchema.optional(),
});

export const doctorStatusSchema = z.object({
  isActive: z.boolean(),
});

export type DoctorInput = z.infer<typeof doctorSchema>;
export type DoctorScheduleInput = z.infer<typeof doctorScheduleSchema>;
