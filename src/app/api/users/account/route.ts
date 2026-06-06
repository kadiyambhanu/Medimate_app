import { apiHandler, successResponse, errorResponse } from "@/lib/api-helpers";
import { removeAuthCookie } from "@/lib/auth";
import User from "@/models/User";
import Medicine from "@/models/Medicine";
import Reminder from "@/models/Reminder";
import Prescription from "@/models/Prescription";
import FamilyMember from "@/models/FamilyMember";
import Notification from "@/models/Notification";
import Inventory from "@/models/Inventory";

export const DELETE = apiHandler(async (userId) => {
  const user = await User.findById(userId);
  if (!user) return errorResponse("User not found", 404);

  await Promise.all([
    Medicine.deleteMany({ userId }),
    Reminder.deleteMany({ userId }),
    Prescription.deleteMany({ userId }),
    FamilyMember.deleteMany({ userId }),
    Notification.deleteMany({ userId }),
    Inventory.deleteMany({ userId }),
    User.findByIdAndDelete(userId),
  ]);

  await removeAuthCookie();

  return successResponse(null, "Account deleted successfully");
});
