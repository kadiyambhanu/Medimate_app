import { z } from "zod";

export const notificationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  type: z.enum(["reminder", "missed", "system", "family"]).default("system"),
});

export type NotificationInput = z.infer<typeof notificationSchema>;
