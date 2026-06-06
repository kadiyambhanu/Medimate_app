import Reminder from "@/models/Reminder";
import Notification from "@/models/Notification";

type ReminderStatus = "taken" | "missed" | "snoozed";

export async function updateReminderStatus(
  userId: string,
  id: string,
  status: ReminderStatus,
  notes?: string
) {
  const update: Record<string, unknown> = { notes };

  if (status === "taken") {
    update.status = "taken";
    update.takenAt = new Date();
  } else if (status === "missed") {
    update.status = "missed";
  } else if (status === "snoozed") {
    update.status = "pending";
    update.snoozedUntil = new Date(Date.now() + 15 * 60 * 1000);
  }

  const reminder = await Reminder.findOneAndUpdate({ _id: id, userId }, update, { new: true }).populate(
    "medicineId",
    "medicineName"
  );

  if (!reminder) return null;

  if (status === "missed") {
    const medicineName =
      typeof reminder.medicineId === "object" && reminder.medicineId !== null
        ? (reminder.medicineId as { medicineName: string }).medicineName
        : "medicine";

    await Notification.create({
      userId,
      title: "Missed Dose Alert",
      message: `You missed your ${medicineName} dose.`,
      type: "missed",
    });
  }

  return reminder;
}
