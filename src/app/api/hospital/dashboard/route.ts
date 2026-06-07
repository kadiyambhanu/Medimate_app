import { hospitalHandler, successResponse } from "@/lib/api-helpers";
import { getHospitalDashboardStats } from "@/services/super-admin-reports.service";

export const GET = hospitalHandler(async (hospitalId) => {
  const stats = await getHospitalDashboardStats(hospitalId);
  return successResponse(stats);
});
