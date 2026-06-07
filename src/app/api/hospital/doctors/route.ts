import { hospitalHandler, successResponse, errorResponse } from "@/lib/api-helpers";
import { doctorSchema } from "@/validations/doctor";
import Doctor from "@/models/Doctor";
import DoctorSchedule from "@/models/DoctorSchedule";

export const GET = hospitalHandler(async (hospitalId) => {
  const doctors = await Doctor.find({ hospitalId }).sort({ name: 1 }).lean();
  const doctorIds = doctors.map((d) => d._id);
  const schedules = await DoctorSchedule.find({ doctorId: { $in: doctorIds } }).lean();
  const scheduleMap = new Map(schedules.map((s) => [s.doctorId.toString(), s]));

  const items = doctors.map((doctor) => ({
    ...doctor,
    schedule: scheduleMap.get(doctor._id.toString()) ?? null,
  }));

  return successResponse(items);
});

export const POST = hospitalHandler(async (hospitalId, _auth, request) => {
  const body = await request.json();
  const parsed = doctorSchema.safeParse({ ...body, hospitalId });

  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0].message);
  }

  const { schedule, ...doctorData } = parsed.data;
  const doctor = await Doctor.create(doctorData);

  if (schedule) {
    await DoctorSchedule.create({ doctorId: doctor._id, ...schedule });
  } else {
    await DoctorSchedule.create({ doctorId: doctor._id });
  }

  const savedSchedule = await DoctorSchedule.findOne({ doctorId: doctor._id });
  return successResponse(
    { ...doctor.toObject(), schedule: savedSchedule },
    "Doctor added successfully",
    201
  );
});
