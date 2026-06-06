import { apiHandler, successResponse } from "@/lib/api-helpers";
import Medicine from "@/models/Medicine";
import Reminder from "@/models/Reminder";
import { calculateAdherence } from "@/lib/utils";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

export const GET = apiHandler(async (userId) => {
  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);

  const [
    totalMedicines,
    activeMedicines,
    todayReminders,
    missedToday,
    upcomingReminders,
    recentReminders,
    weekReminders,
  ] = await Promise.all([
    Medicine.countDocuments({ userId }),
    Medicine.countDocuments({ userId, status: "active" }),
    Reminder.countDocuments({
      userId,
      scheduledDate: { $gte: todayStart, $lte: todayEnd },
    }),
    Reminder.countDocuments({
      userId,
      scheduledDate: { $gte: todayStart, $lte: todayEnd },
      status: "missed",
    }),
    Reminder.find({
      userId,
      status: "pending",
      scheduledDate: { $gte: todayStart },
    })
      .populate("medicineId", "medicineName dosage")
      .sort({ reminderTime: 1 })
      .limit(5),
    Reminder.find({ userId })
      .populate("medicineId", "medicineName")
      .sort({ updatedAt: -1 })
      .limit(10),
    Reminder.find({
      userId,
      scheduledDate: { $gte: subDays(today, 7) },
    }),
  ]);

  const takenWeek = weekReminders.filter((r) => r.status === "taken").length;
  const totalWeek = weekReminders.length;
  const adherenceRate = calculateAdherence(takenWeek, totalWeek);

  const weeklyAdherence = Array.from({ length: 7 }, (_, i) => {
    const day = subDays(today, 6 - i);
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    const dayReminders = weekReminders.filter(
      (r) => r.scheduledDate >= dayStart && r.scheduledDate <= dayEnd
    );
    return {
      day: format(day, "EEE"),
      taken: dayReminders.filter((r) => r.status === "taken").length,
      missed: dayReminders.filter((r) => r.status === "missed").length,
      total: dayReminders.length,
    };
  });

  const recentActivity = recentReminders.map((r) => ({
    id: r._id.toString(),
    type: r.status === "taken" ? "taken" : r.status === "missed" ? "missed" : "updated",
    title:
      r.status === "taken"
        ? "Medicine Taken"
        : r.status === "missed"
          ? "Medicine Missed"
          : "Reminder Updated",
    description: `${(r.medicineId as { medicineName?: string })?.medicineName || "Medicine"} at ${r.reminderTime}`,
    timestamp: r.updatedAt,
  }));

  return successResponse({
    totalMedicines,
    activeMedicines,
    todayMedicines: todayReminders,
    missedMedicines: missedToday,
    adherenceRate,
    upcomingReminders,
    recentActivity,
    weeklyAdherence,
  });
});
