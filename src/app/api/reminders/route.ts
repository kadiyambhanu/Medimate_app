import { apiHandler, successResponse, errorResponse } from "@/lib/api-helpers";
import { reminderSchema } from "@/validations/reminder";
import Reminder from "@/models/Reminder";
import { syncRemindersForDate } from "@/services/reminder-sync.service";

export const GET = apiHandler(async (userId, request) => {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const status = searchParams.get("status");

  if (date) {
    await syncRemindersForDate(userId, new Date(date));
  }

  const filter: Record<string, unknown> = { userId };
  if (status) filter.status = status;
  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    filter.scheduledDate = { $gte: start, $lte: end };
  }

  const reminders = await Reminder.find(filter)
    .populate("medicineId", "medicineName dosage timings reminderTimes")
    .sort({ reminderTime: 1 });

  return successResponse(reminders);
});

export const POST = apiHandler(async (userId, request) => {
  const body = await request.json();
  const parsed = reminderSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0].message);
  }

  const reminder = await Reminder.create({
    ...parsed.data,
    userId,
    scheduledDate: new Date(parsed.data.scheduledDate),
  });

  const populated = await reminder.populate("medicineId", "medicineName dosage");
  return successResponse(populated, "Reminder created successfully", 201);
});
