import { hospitalParamsHandler, successResponse, errorResponse } from "@/lib/api-helpers";
import { doctorScheduleSchema } from "@/validations/doctor";
import Doctor from "@/models/Doctor";
import DoctorSchedule from "@/models/DoctorSchedule";

export const PUT = hospitalParamsHandler(async (hospitalId, _auth, request, id) => {
  const schedule = await DoctorSchedule.findById(id);
  if (!schedule) return errorResponse("Schedule not found", 404);

  const doctor = await Doctor.findOne({ _id: schedule.doctorId, hospitalId });
  if (!doctor) return errorResponse("Forbidden", 403);

  const body = await request.json();
  const parsed = doctorScheduleSchema.safeParse(body);

  if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

  const updated = await DoctorSchedule.findByIdAndUpdate(id, parsed.data, { new: true });
  return successResponse(updated, "Schedule updated");
});

export const DELETE = hospitalParamsHandler(async (hospitalId, _auth, _request, id) => {
  const schedule = await DoctorSchedule.findById(id);
  if (!schedule) return errorResponse("Schedule not found", 404);

  const doctor = await Doctor.findOne({ _id: schedule.doctorId, hospitalId });
  if (!doctor) return errorResponse("Forbidden", 403);

  await DoctorSchedule.findByIdAndDelete(id);
  return successResponse(null, "Schedule deleted");
});
