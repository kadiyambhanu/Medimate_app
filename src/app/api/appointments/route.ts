import {
  withAuth,
  apiHandler,
  successResponse,
  errorResponse,
} from "@/lib/api-helpers";
import { appointmentSchema } from "@/validations/appointment";
import { ROLES } from "@/lib/constants";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import Appointment from "@/models/Appointment";
import { createAppointment } from "@/services/appointment.service";
import { normalizeAppointmentDate } from "@/services/slot.service";

export async function GET(request: Request) {
  return withAuth(request as never, async (userId, req) => {
    const { searchParams } = new URL(req.url);
    const admin = searchParams.get("admin") === "true";
    const status = searchParams.get("status");
    const date = searchParams.get("date");

    if (admin) {
      const token = getTokenFromRequest(req);
      const payload = token ? verifyToken(token) : null;
      if (payload?.role !== ROLES.SUPER_ADMIN) {
        return errorResponse("Forbidden", 403);
      }
    }

    const filter: Record<string, unknown> = admin ? {} : { userId };
    if (status) filter.status = status;
    if (date) filter.appointmentDate = normalizeAppointmentDate(date);

    const appointments = await Appointment.find(filter)
      .populate("userId", "name email phone")
      .populate("hospitalId", "hospitalName address")
      .populate("doctorId", "name specialization consultationFee")
      .sort({ appointmentDate: -1, slotTime: -1 })
      .lean();

    return successResponse(appointments);
  });
}

export const POST = apiHandler(async (userId, request) => {
  const body = await request.json();
  const parsed = appointmentSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0].message);
  }

  try {
    const appointment = await createAppointment(userId, parsed.data);
    const populated = await Appointment.findById(appointment._id)
      .populate("hospitalId", "hospitalName")
      .populate("doctorId", "name specialization")
      .lean();

    const message =
      parsed.data.paymentMethod === "UPI" && parsed.data.paymentCompleted
        ? "Payment confirmed. Appointment confirmed."
        : "Appointment booked successfully";

    return successResponse(populated, message, 201);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Booking failed");
  }
});
