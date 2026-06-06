import { apiHandler, successResponse, errorResponse } from "@/lib/api-helpers";
import { profileSchema } from "@/validations/profile";
import { sanitizeUser } from "@/lib/auth";
import User from "@/models/User";

export const GET = apiHandler(async (userId) => {
  const user = await User.findById(userId);
  if (!user) return errorResponse("User not found", 404);
  return successResponse(sanitizeUser(user.toObject()));
});

export const PUT = apiHandler(async (userId, request) => {
  const body = await request.json();
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

  const user = await User.findByIdAndUpdate(userId, parsed.data, { new: true });
  if (!user) return errorResponse("User not found", 404);
  return successResponse(sanitizeUser(user.toObject()), "Profile updated successfully");
});
