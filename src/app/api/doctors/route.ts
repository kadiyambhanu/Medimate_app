import { withAuth, successResponse, errorResponse } from "@/lib/api-helpers";
import { ROLES } from "@/lib/constants";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import Doctor from "@/models/Doctor";
import DoctorSchedule from "@/models/DoctorSchedule";

export async function GET(request: Request) {
  return withAuth(request as never, async (_userId, req) => {
    const { searchParams } = new URL(req.url);
    const hospitalId = searchParams.get("hospitalId");
    const admin = searchParams.get("admin") === "true";

    if (admin) {
      const token = getTokenFromRequest(req);
      const payload = token ? verifyToken(token) : null;
      if (payload?.role !== ROLES.SUPER_ADMIN) {
        return errorResponse("Forbidden", 403);
      }
    }

    const filter: Record<string, unknown> = {};
    if (hospitalId) filter.hospitalId = hospitalId;
    if (!admin) filter.isActive = true;

    const doctors = await Doctor.find(filter)
      .populate("hospitalId", "hospitalName")
      .sort({ name: 1 })
      .lean();

    const doctorIds = doctors.map((d) => d._id);
    const schedules = await DoctorSchedule.find({ doctorId: { $in: doctorIds } }).lean();
    const scheduleMap = new Map(schedules.map((s) => [s.doctorId.toString(), s]));

    const items = doctors.map((doctor) => ({
      ...doctor,
      schedule: scheduleMap.get(doctor._id.toString()) ?? null,
    }));

    return successResponse(items);
  });
}
