import { NextRequest } from "next/server";
import { roleHandler, successResponse, errorResponse } from "@/lib/api-helpers";
import { ROLES } from "@/lib/constants";
import {
  getHospitalReports,
  getAppointmentReports,
  getUserReports,
} from "@/services/super-admin-reports.service";

export const GET = roleHandler([ROLES.SUPER_ADMIN], async (_userId, request) => {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  switch (type) {
    case "hospitals":
      return successResponse(await getHospitalReports());
    case "appointments":
      return successResponse(await getAppointmentReports());
    case "users":
      return successResponse(await getUserReports());
    default:
      return errorResponse("Invalid report type. Use hospitals, appointments, or users");
  }
});
