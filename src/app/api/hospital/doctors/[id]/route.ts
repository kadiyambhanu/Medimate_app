import { hospitalParamsHandler, successResponse, errorResponse } from "@/lib/api-helpers";
import { doctorSchema, doctorStatusSchema } from "@/validations/doctor";
import Doctor from "@/models/Doctor";
import DoctorSchedule from "@/models/DoctorSchedule";

export const GET = hospitalParamsHandler(async (hospitalId, _auth, _request, id) => {
  const doctor = await Doctor.findOne({ _id: id, hospitalId }).lean();
  if (!doctor) return errorResponse("Doctor not found", 404);

  const schedule = await DoctorSchedule.findOne({ doctorId: id }).lean();
  return successResponse({ ...doctor, schedule: schedule ?? null });
});

export const PUT = hospitalParamsHandler(async (hospitalId, _auth, request, id) => {
  const doctor = await Doctor.findOne({ _id: id, hospitalId });
  if (!doctor) return errorResponse("Doctor not found", 404);

  const body = await request.json();

  if (body.isActive !== undefined && Object.keys(body).length === 1) {
    const parsed = doctorStatusSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);
    const updated = await Doctor.findByIdAndUpdate(id, parsed.data, { new: true });
    return successResponse(updated, "Doctor status updated");
  }

  const parsed = doctorSchema.safeParse({ ...body, hospitalId });
  if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

  const { schedule, ...doctorData } = parsed.data;
  const updated = await Doctor.findByIdAndUpdate(id, doctorData, { new: true });

  if (schedule) {
    await DoctorSchedule.findOneAndUpdate(
      { doctorId: id },
      { ...schedule, doctorId: id },
      { upsert: true, new: true }
    );
  }

  const savedSchedule = await DoctorSchedule.findOne({ doctorId: id });
  return successResponse({ ...updated?.toObject(), schedule: savedSchedule }, "Doctor updated");
});

export const DELETE = hospitalParamsHandler(async (hospitalId, _auth, _request, id) => {
  const doctor = await Doctor.findOneAndDelete({ _id: id, hospitalId });
  if (!doctor) return errorResponse("Doctor not found", 404);
  await DoctorSchedule.deleteOne({ doctorId: id });
  return successResponse(null, "Doctor deleted");
});
