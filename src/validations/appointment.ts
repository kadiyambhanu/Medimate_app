import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const paymentMethodSchema = z.enum(["UPI", "PAY_AT_HOSPITAL"], {
  message: "Payment method is required",
});

export const patientDetailsSchema = z.object({
  name: z.string().min(1, "Patient name is required"),
  gender: z.enum(["Male", "Female", "Other"], { message: "Gender is required" }),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  height: z.number().positive("Height is required"),
  weight: z.number().positive("Weight is required"),
  diseaseName: z.string().min(1, "Disease name is required"),
});

export const appointmentSchema = z.object({
  hospitalId: z.string().min(1, "Hospital is required"),
  doctorId: z.string().min(1, "Doctor is required"),
  appointmentDate: z.string().min(1, "Appointment date is required"),
  slotTime: z.string().regex(timeRegex, "Invalid slot time"),
  notes: z.string().optional(),
  paymentMethod: paymentMethodSchema,
  patientDetails: patientDetailsSchema,
  paymentCompleted: z.boolean().optional(),
  upiTransactionId: z.string().optional(),
}).refine(
  (data) => {
    if (data.paymentMethod === "UPI") {
      return data.paymentCompleted === true && Boolean(data.upiTransactionId);
    }
    return true;
  },
  { message: "Complete UPI payment before booking", path: ["paymentCompleted"] }
);

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
export type PatientDetailsInput = z.infer<typeof patientDetailsSchema>;
