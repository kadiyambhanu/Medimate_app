import { NextRequest } from "next/server";
import { withAuthParams, successResponse, errorResponse } from "@/lib/api-helpers";
import Notification from "@/models/Notification";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withAuthParams(request, context, async (userId, req, id) => {
    const body = await req.json();
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { status: body.status || "read" },
      { new: true }
    );
    if (!notification) return errorResponse("Notification not found", 404);
    return successResponse(notification);
  });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withAuthParams(request, context, async (userId, _req, id) => {
    const notification = await Notification.findOneAndDelete({ _id: id, userId });
    if (!notification) return errorResponse("Notification not found", 404);
    return successResponse(null, "Notification deleted");
  });
}
