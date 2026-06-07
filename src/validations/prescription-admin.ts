import { z } from "zod";

export const prescriptionAttachSchema = z.object({
  userId: z.string().min(1, "User is required"),
  appointmentId: z.string().optional(),
  doctorId: z.string().optional(),
  autoApply: z.boolean().optional(),
});

export type PrescriptionAttachInput = z.infer<typeof prescriptionAttachSchema>;
