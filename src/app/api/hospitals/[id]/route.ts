import {
  withAuthParams,
  roleParamsHandler,
  successResponse,
  errorResponse,
} from "@/lib/api-helpers";
import { hospitalUpdateSchema, hospitalStatusSchema } from "@/validations/hospital";
import { ROLES } from "@/lib/constants";
import Hospital from "@/models/Hospital";
import Doctor from "@/models/Doctor";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return withAuthParams(request as never, context, async (_userId, _req, id) => {
    const hospital = await Hospital.findById(id).select("-password").lean();
    if (!hospital) return errorResponse("Hospital not found", 404);

    const doctors = await Doctor.find({ hospitalId: id, isActive: true })
      .select("name profileImage specialization experience consultationFee isActive")
      .lean();

    return successResponse({ ...hospital, doctors, totalDoctors: doctors.length });
  });
}

export const PUT = roleParamsHandler([ROLES.SUPER_ADMIN], async (_auth, request, id) => {
  const body = await request.json();

  if (body.status && Object.keys(body).length === 1) {
    const parsed = hospitalStatusSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);
    const hospital = await Hospital.findByIdAndUpdate(id, parsed.data, { new: true }).select("-password");
    if (!hospital) return errorResponse("Hospital not found", 404);
    return successResponse(hospital, "Hospital status updated");
  }

  const parsed = hospitalUpdateSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

  const hospital = await Hospital.findByIdAndUpdate(id, parsed.data, { new: true }).select("-password");
  if (!hospital) return errorResponse("Hospital not found", 404);
  return successResponse(hospital, "Hospital updated successfully");
});

export const DELETE = roleParamsHandler([ROLES.SUPER_ADMIN], async (_auth, _request, id) => {
  const hospital = await Hospital.findByIdAndDelete(id);
  if (!hospital) return errorResponse("Hospital not found", 404);
  return successResponse(null, "Hospital deleted successfully");
});
