import { hospitalHandler, successResponse, errorResponse } from "@/lib/api-helpers";
import Appointment from "@/models/Appointment";
import { normalizeAppointmentDate } from "@/services/slot.service";

export const GET = hospitalHandler(async (hospitalId, _auth, request) => {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search") || "";
  const date = searchParams.get("date");

  if (!date) {
    return errorResponse("Date is required", 400);
  }

  const filter: Record<string, unknown> = {
    hospitalId,
    appointmentDate: normalizeAppointmentDate(date),
  };
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
      const patient = apt.patientDetails as { name?: string; diseaseName?: string } | null;
      return (
        patient?.name?.toLowerCase().includes(q) ||
        patient?.diseaseName?.toLowerCase().includes(q) ||
        user?.name?.toLowerCase().includes(q) ||
        user?.email?.toLowerCase().includes(q) ||
        doctor?.name?.toLowerCase().includes(q)
      );
    });
  }

  return successResponse(appointments);
});
