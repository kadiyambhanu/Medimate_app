import { NextRequest } from "next/server";
import { withAuthParams, successResponse, errorResponse } from "@/lib/api-helpers";
import { updateReminderStatus } from "@/services/reminder-actions";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withAuthParams(request, context, async (userId, _req, id) => {
    const reminder = await updateReminderStatus(userId, id, "snoozed");
    if (!reminder) return errorResponse("Reminder not found", 404);
    return successResponse(reminder, "Reminder snoozed for 15 minutes");
  });
}
