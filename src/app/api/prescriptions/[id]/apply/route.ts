import { roleParamsHandler, successResponse, errorResponse } from "@/lib/api-helpers";
import { ROLES } from "@/lib/constants";
import { applyPrescriptionToUser } from "@/services/prescription-admin.service";

export const POST = roleParamsHandler([ROLES.SUPER_ADMIN], async (_auth, _request, id) => {
  try {
    const result = await applyPrescriptionToUser(id);
    return successResponse(result, "Prescription applied — medicines and reminders created");
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Failed to apply prescription");
  }
});
