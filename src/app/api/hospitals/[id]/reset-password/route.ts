import { roleParamsHandler, successResponse, errorResponse } from "@/lib/api-helpers";
import { hospitalPasswordResetSchema } from "@/validations/hospital";
import { ROLES } from "@/lib/constants";
import { hashPassword } from "@/lib/auth";
import Hospital from "@/models/Hospital";

export const PUT = roleParamsHandler([ROLES.SUPER_ADMIN], async (_auth, request, id) => {
  const body = await request.json();
  const parsed = hospitalPasswordResetSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0].message);
  }

  const hospital = await Hospital.findById(id);
  if (!hospital) return errorResponse("Hospital not found", 404);

  hospital.password = await hashPassword(parsed.data.password);
  await hospital.save();

  return successResponse(null, "Hospital password reset successfully");
});
