import { apiHandler, successResponse, errorResponse } from "@/lib/api-helpers";
import { sanitizeUser } from "@/lib/auth";
import { dailyRoutineSchema } from "@/lib/daily-routine";
import User from "@/models/User";

export const GET = apiHandler(async (userId) => {
  const user = await User.findById(userId).select("dailyRoutine");
  if (!user) return errorResponse("User not found", 404);
  return successResponse(user.dailyRoutine);
});

export const PUT = apiHandler(async (userId, request) => {
  const body = await request.json();
  const parsed = dailyRoutineSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0].message);
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { dailyRoutine: parsed.data },
    { new: true }
  );

  if (!user) return errorResponse("User not found", 404);
  return successResponse(sanitizeUser(user.toObject()), "Daily routine updated");
});
