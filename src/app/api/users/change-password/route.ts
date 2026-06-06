import { apiHandler, successResponse, errorResponse } from "@/lib/api-helpers";
import { changePasswordSchema } from "@/validations/profile";
import { comparePassword, hashPassword } from "@/lib/auth";
import User from "@/models/User";

export const PUT = apiHandler(async (userId, request) => {
  const body = await request.json();
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
});
