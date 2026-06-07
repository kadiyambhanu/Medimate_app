import { hospitalHandler, successResponse, errorResponse } from "@/lib/api-helpers";
import { doctorScheduleSchema } from "@/validations/doctor";
import Doctor from "@/models/Doctor";
import DoctorSchedule from "@/models/DoctorSchedule";

export const GET = hospitalHandler(async (hospitalId) => {
  const doctors = await Doctor.find({ hospitalId }).select("_id name").lean();
  const doctorIds = doctors.map((d) => d._id);
  const schedules = await DoctorSchedule.find({ doctorId: { $in: doctorIds } })
    .populate("doctorId", "name specialization")
    .lean();
  return successResponse(schedules);
});

export const POST = hospitalHandler(async (hospitalId, _auth, request) => {
  const body = await request.json();
  const parsed = doctorScheduleSchema.safeParse(body.schedule ?? body);

  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0].message);
  }

  const doctorId = body.doctorId;
  if (!doctorId) return errorResponse("Doctor is required");

  const doctor = await Doctor.findOne({ _id: doctorId, hospitalId });
  if (!doctor) return errorResponse("Doctor not found", 404);

  const schedule = await DoctorSchedule.findOneAndUpdate(
    { doctorId },
    { doctorId, ...parsed.data },
    { upsert: true, new: true }
  );

  return successResponse(schedule, "Schedule saved", 201);
});
