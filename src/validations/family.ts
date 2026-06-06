import { z } from "zod";

export const familyMemberSchema = z.object({
  memberName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  relation: z.string().min(1, "Relationship is required"),
});

export type FamilyMemberInput = z.infer<typeof familyMemberSchema>;
