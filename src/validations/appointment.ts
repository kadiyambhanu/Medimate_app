import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const appointmentSchema = z.object({
  hospitalId: z.string().min(1, "Hospital is required"),
  doctorId: z.string().min(1, "Doctor is required"),
  appointmentDate: z.string().min(1, "Appointment date is required"),
  slotTime: z.string().regex(timeRegex, "Invalid slot time"),
  notes: z.string().optional(),
});

export const appointmentRescheduleSchema = z.object({
  appointmentDate: z.string().min(1, "Appointment date is required"),
  slotTime: z.string().regex(timeRegex, "Invalid slot time"),
  notes: z.string().optional(),
});

export const appointmentStatusSchema = z.object({
  status: z.enum(["BOOKED", "COMPLETED", "CANCELLED"]),
});

export type AppointmentInput = z.infer<typeof appointmentSchema>;
export type AppointmentRescheduleInput = z.infer<typeof appointmentRescheduleSchema>;
