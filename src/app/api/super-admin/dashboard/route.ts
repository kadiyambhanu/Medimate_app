import { roleHandler, successResponse } from "@/lib/api-helpers";
import { ROLES } from "@/lib/constants";
import { getSuperAdminDashboardStats } from "@/services/super-admin-reports.service";

export const GET = roleHandler([ROLES.SUPER_ADMIN], async () => {
  const stats = await getSuperAdminDashboardStats();
  return successResponse(stats);
});
