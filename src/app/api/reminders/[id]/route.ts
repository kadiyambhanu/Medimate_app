import { NextRequest } from "next/server";
import { withAuthParams, successResponse, errorResponse } from "@/lib/api-helpers";
import { reminderSchema, reminderStatusSchema } from "@/validations/reminder";
import Reminder from "@/models/Reminder";
import Notification from "@/models/Notification";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withAuthParams(request, context, async (userId, _req, id) => {
    const reminder = await Reminder.findOne({ _id: id, userId }).populate("medicineId");
    if (!reminder) return errorResponse("Reminder not found", 404);
    return successResponse(reminder);
  });
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withAuthParams(request, context, async (userId, req, id) => {
    const body = await req.json();

    if (body.status) {
      const parsed = reminderStatusSchema.safeParse(body);
      if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

      const update: Record<string, unknown> = { status: parsed.data.status, notes: parsed.data.notes };
      if (parsed.data.status === "taken") update.takenAt = new Date();
      if (parsed.data.status === "snoozed") {
        update.snoozedUntil = new Date(Date.now() + 15 * 60 * 1000);
        update.status = "pending";
      }

      const reminder = await Reminder.findOneAndUpdate({ _id: id, userId }, update, { new: true })
        .populate("medicineId", "medicineName");

      if (!reminder) return errorResponse("Reminder not found", 404);

      if (parsed.data.status === "missed") {
        await Notification.create({
          userId,
          title: "Missed Dose Alert",
          message: `You missed your ${(reminder.medicineId as { medicineName: string }).medicineName} dose.`,
          type: "missed",
        });
      }

      return successResponse(reminder, "Reminder updated successfully");
    }

    const parsed = reminderSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    const reminder = await Reminder.findOneAndUpdate(
      { _id: id, userId },
      { ...parsed.data, scheduledDate: new Date(parsed.data.scheduledDate) },
      { new: true }
    ).populate("medicineId");

    if (!reminder) return errorResponse("Reminder not found", 404);
    return successResponse(reminder, "Reminder updated successfully");
  });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withAuthParams(request, context, async (userId, _req, id) => {
    const reminder = await Reminder.findOneAndDelete({ _id: id, userId });
    if (!reminder) return errorResponse("Reminder not found", 404);
    return successResponse(null, "Reminder deleted successfully");
  });
}
