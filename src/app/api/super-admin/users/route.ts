import { roleHandler, successResponse } from "@/lib/api-helpers";
import { ROLES } from "@/lib/constants";
import User from "@/models/User";

export const GET = roleHandler([ROLES.SUPER_ADMIN], async () => {
  const users = await User.find({ role: ROLES.PATIENT })
    .select("name email phone createdAt")
    .sort({ name: 1 })
    .lean();
  return successResponse(users);
});
