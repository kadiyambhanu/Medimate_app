import { NextRequest } from "next/server";
import { withAuthParams, successResponse, errorResponse } from "@/lib/api-helpers";
import Notification from "@/models/Notification";

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withAuthParams(request, context, async (userId, _req, id) => {
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { status: "read" },
      { new: true }
    );
    if (!notification) return errorResponse("Notification not found", 404);
    return successResponse(notification, "Notification marked as read");
  });
}
