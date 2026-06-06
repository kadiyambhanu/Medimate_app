import { apiHandler, successResponse, errorResponse } from "@/lib/api-helpers";
import { notificationSchema } from "@/validations/notification";
import Notification from "@/models/Notification";

export const GET = apiHandler(async (userId) => {
  const notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(50);
  return successResponse(notifications);
});

export const POST = apiHandler(async (userId, request) => {
  const body = await request.json();
  const parsed = notificationSchema.safeParse(body);

  if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

  const notification = await Notification.create({ ...parsed.data, userId });
  return successResponse(notification, "Notification created", 201);
});
