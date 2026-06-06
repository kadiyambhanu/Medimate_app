import { apiHandler, successResponse, errorResponse } from "@/lib/api-helpers";
import { profileSchema, changePasswordSchema } from "@/validations/profile";
import { comparePassword, hashPassword, sanitizeUser } from "@/lib/auth";
import User from "@/models/User";

export const GET = apiHandler(async (userId) => {
  const user = await User.findById(userId);
  if (!user) return errorResponse("User not found", 404);
  return successResponse(sanitizeUser(user.toObject()));
});

export const PUT = apiHandler(async (userId, request) => {
  const body = await request.json();

  if (body.currentPassword) {
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    const user = await User.findById(userId);
    if (!user) return errorResponse("User not found", 404);

    if (!(await comparePassword(parsed.data.currentPassword, user.password))) {
      return errorResponse("Current password is incorrect");
    }

    user.password = await hashPassword(parsed.data.newPassword);
    await user.save();
    return successResponse(null, "Password changed successfully");
  }

  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

  const user = await User.findByIdAndUpdate(userId, parsed.data, { new: true });
  if (!user) return errorResponse("User not found", 404);
  return successResponse(sanitizeUser(user.toObject()), "Profile updated successfully");
});
