import {
  withAuthParams,
  roleParamsHandler,
  successResponse,
  errorResponse,
} from "@/lib/api-helpers";
import { doctorStatusSchema } from "@/validations/doctor";
import { ROLES } from "@/lib/constants";
import Doctor from "@/models/Doctor";
import DoctorSchedule from "@/models/DoctorSchedule";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return withAuthParams(request as never, context, async (_userId, _req, id) => {
    const doctor = await Doctor.findById(id).populate("hospitalId", "hospitalName address phone").lean();
    if (!doctor) return errorResponse("Doctor not found", 404);

    const schedule = await DoctorSchedule.findOne({ doctorId: id }).lean();
    return successResponse({ ...doctor, schedule });
  });
}

export const PUT = roleParamsHandler([ROLES.SUPER_ADMIN], async (_auth, request, id) => {
  const body = await request.json();
  const parsed = doctorStatusSchema.safeParse(body);

  if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

  const doctor = await Doctor.findByIdAndUpdate(id, parsed.data, { new: true });
  if (!doctor) return errorResponse("Doctor not found", 404);
  return successResponse(doctor, "Doctor status updated");
});
