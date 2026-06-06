import { z } from "zod";

export const prescriptionSchema = z.object({
  imageUrl: z
    .string()
    .min(1, "Image URL is required")
    .refine((url) => url.startsWith("/") || url.startsWith("http"), "Invalid image URL"),
  fileName: z.string().min(1, "File name is required"),
  extractedText: z.string().optional(),
});

export type PrescriptionInput = z.infer<typeof prescriptionSchema>;
