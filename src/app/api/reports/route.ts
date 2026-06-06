import { apiHandler, successResponse } from "@/lib/api-helpers";
import Reminder from "@/models/Reminder";
import Medicine from "@/models/Medicine";
import { calculateAdherence } from "@/lib/utils";
import { subDays, subMonths, startOfDay, endOfDay, format } from "date-fns";

export const GET = apiHandler(async (userId, request) => {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "weekly";
  const today = new Date();

  let startDate: Date;
  switch (period) {
    case "daily":
      startDate = startOfDay(today);
      break;
    case "monthly":
      startDate = subMonths(today, 1);
      break;
    default:
      startDate = subDays(today, 7);
  }

  const [reminders, medicines] = await Promise.all([
    Reminder.find({
      userId,
      scheduledDate: { $gte: startDate, $lte: endOfDay(today) },
    }).populate("medicineId", "medicineName"),
    Medicine.find({ userId }),
  ]);

  const taken = reminders.filter((r) => r.status === "taken").length;
  const missed = reminders.filter((r) => r.status === "missed").length;
  const pending = reminders.filter((r) => r.status === "pending").length;
  const total = reminders.length;
  const adherenceRate = calculateAdherence(taken, total);

  const medicineStats = medicines.map((med) => {
    const medReminders = reminders.filter(
      (r) => (r.medicineId as { _id?: { toString: () => string } })?._id?.toString() === med._id.toString()
    );
    const medTaken = medReminders.filter((r) => r.status === "taken").length;
    return {
      medicineId: med._id.toString(),
      medicineName: med.medicineName,
      total: medReminders.length,
      taken: medTaken,
      missed: medReminders.filter((r) => r.status === "missed").length,
      adherence: calculateAdherence(medTaken, medReminders.length),
    };
  });

  const dailyBreakdown = reminders.reduce(
    (acc, r) => {
      const day = format(r.scheduledDate, "yyyy-MM-dd");
      if (!acc[day]) acc[day] = { taken: 0, missed: 0, pending: 0 };
      acc[day][r.status as "taken" | "missed" | "pending"]++;
      return acc;
    },
    {} as Record<string, { taken: number; missed: number; pending: number }>
  );

  return successResponse({
    period,
    summary: { total, taken, missed, pending, adherenceRate },
    medicineStats,
    dailyBreakdown,
    generatedAt: new Date(),
  });
});
