import { hospitalHandler, successResponse, errorResponse } from "@/lib/api-helpers";
import { hospitalProfileSchema } from "@/validations/hospital";
import Hospital from "@/models/Hospital";

export const GET = hospitalHandler(async (hospitalId) => {
  const hospital = await Hospital.findById(hospitalId).select("-password");
  if (!hospital) return errorResponse("Hospital not found", 404);
  return successResponse(hospital);
});

export const PUT = hospitalHandler(async (hospitalId, _auth, request) => {
  const body = await request.json();
  const parsed = hospitalProfileSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0].message);
  }

  const hospital = await Hospital.findByIdAndUpdate(hospitalId, parsed.data, { new: true }).select("-password");
  if (!hospital) return errorResponse("Hospital not found", 404);
  return successResponse(hospital, "Profile updated successfully");
});
