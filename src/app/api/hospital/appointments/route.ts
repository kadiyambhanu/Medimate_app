import { hospitalHandler, successResponse } from "@/lib/api-helpers";
import Appointment from "@/models/Appointment";

export const GET = hospitalHandler(async (hospitalId, _auth, request) => {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search") || "";

  const filter: Record<string, unknown> = { hospitalId };
  if (status) filter.status = status;

  let appointments = await Appointment.find(filter)
    .populate("userId", "name email phone")
    .populate("doctorId", "name specialization")
    .sort({ appointmentDate: -1, slotTime: -1 })
    .lean();

  if (search) {
    const q = search.toLowerCase();
    appointments = appointments.filter((apt) => {
      const user = apt.userId as { name?: string; email?: string } | null;
      const doctor = apt.doctorId as { name?: string } | null;
      return (
        user?.name?.toLowerCase().includes(q) ||
        user?.email?.toLowerCase().includes(q) ||
        doctor?.name?.toLowerCase().includes(q)
      );
    });
  }

  return successResponse(appointments);
});
