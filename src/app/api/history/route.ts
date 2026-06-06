import { apiHandler, successResponse } from "@/lib/api-helpers";
import Reminder from "@/models/Reminder";
import { subDays, subMonths, startOfDay, endOfDay } from "date-fns";

export const GET = apiHandler(async (userId, request) => {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "daily";
  const date = searchParams.get("date");
  const today = date ? new Date(date) : new Date();

  let startDate: Date;
  let endDate: Date = endOfDay(today);

  switch (period) {
    case "weekly":
      startDate = startOfDay(subDays(today, 7));
      break;
    case "monthly":
      startDate = startOfDay(subMonths(today, 1));
      break;
    default:
      startDate = startOfDay(today);
  }

  const reminders = await Reminder.find({
    userId,
    scheduledDate: { $gte: startDate, $lte: endDate },
  })
    .populate("medicineId", "medicineName dosage")
    .sort({ scheduledDate: -1, reminderTime: 1 });

  const taken = reminders.filter((r) => r.status === "taken").length;
  const total = reminders.length;

  return successResponse({
    reminders,
    summary: {
      total,
      taken,
      missed: reminders.filter((r) => r.status === "missed").length,
      pending: reminders.filter((r) => r.status === "pending").length,
      adherenceRate: total > 0 ? Math.round((taken / total) * 100) : 0,
    },
    period,
    startDate,
    endDate,
  });
});
