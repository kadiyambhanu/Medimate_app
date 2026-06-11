import mongoose from "mongoose";
import { NextRequest } from "next/server";
import { withAuthParams, successResponse, errorResponse } from "@/lib/api-helpers";
import Notification from "@/models/Notification";

function buildNotificationQuery(id: string, userId: string) {
  if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(userId)) {
    return null;
  }

  return {
    _id: new mongoose.Types.ObjectId(id),
    userId: new mongoose.Types.ObjectId(userId),
  };
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withAuthParams(request, context, async (userId, req, id) => {
    const query = buildNotificationQuery(id, userId);
    if (!query) return errorResponse("Invalid notification id", 400);

    const body = await req.json();
    const notification = await Notification.findOneAndUpdate(
      query,
      { status: body.status || "read" },
      { new: true }
    );
    if (!notification) return errorResponse("Notification not found", 404);
    return successResponse(notification);
  });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withAuthParams(request, context, async (userId, _req, id) => {
    const query = buildNotificationQuery(id, userId);
    if (!query) return errorResponse("Invalid notification id", 400);

    const notification = await Notification.findOneAndDelete(query);
    if (!notification) return errorResponse("Notification not found", 404);
    return successResponse(null, "Notification deleted");
  });
}
