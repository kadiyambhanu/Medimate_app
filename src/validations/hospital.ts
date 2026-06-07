import { z } from "zod";

export const hospitalSchema = z.object({
  hospitalName: z.string().min(2, "Hospital name is required"),
  logo: z.string().optional(),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  address: z.string().min(5, "Address is required"),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const hospitalCreateSchema = hospitalSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const hospitalUpdateSchema = hospitalSchema.partial();

export const hospitalStatusSchema = z.object({
  status: z.enum(["active", "inactive"]),
});

export const hospitalPasswordResetSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const hospitalProfileSchema = z.object({
  hospitalName: z.string().min(2).optional(),
  logo: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().min(5).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  description: z.string().optional(),
});

export type HospitalInput = z.infer<typeof hospitalSchema>;
export type HospitalCreateInput = z.infer<typeof hospitalCreateSchema>;
export type HospitalProfileInput = z.infer<typeof hospitalProfileSchema>;
