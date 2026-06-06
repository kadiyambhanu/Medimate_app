import { apiHandler, successResponse } from "@/lib/api-helpers";
import Notification from "@/models/Notification";

export const PATCH = apiHandler(async (userId) => {
  await Notification.updateMany({ userId, status: "unread" }, { status: "read" });
  return successResponse(null, "All notifications marked as read");
});
