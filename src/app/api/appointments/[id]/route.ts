import {
  withAuthParams,
  roleParamsHandler,
  successResponse,
  errorResponse,
} from "@/lib/api-helpers";
import { appointmentRescheduleSchema } from "@/validations/appointment";
import { ROLES } from "@/lib/constants";
import { cancelAppointment, rescheduleAppointment } from "@/services/appointment.service";
import Appointment from "@/models/Appointment";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return withAuthParams(request as never, context, async (userId, _req, id) => {
    const appointment = await Appointment.findOne({ _id: id, userId })
      .populate("hospitalId", "hospitalName address phone")
      .populate("doctorId", "name specialization consultationFee profileImage")
      .lean();

    if (!appointment) return errorResponse("Appointment not found", 404);
    return successResponse(appointment);
  });
}

export const PUT = roleParamsHandler(
  [ROLES.SUPER_ADMIN, ROLES.PATIENT],
  async (auth, request, id) => {
    const body = await request.json();
    const isAdmin = auth.role === ROLES.SUPER_ADMIN;

    if (body.status === "CANCELLED") {
      try {
        const appointment = await cancelAppointment(id, isAdmin ? undefined : auth.id, isAdmin);
        return successResponse(appointment, "Appointment cancelled");
      } catch (error) {
        return errorResponse(error instanceof Error ? error.message : "Cancellation failed");
      }
    }

    const parsed = appointmentRescheduleSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    try {
      const appointment = await rescheduleAppointment(id, parsed.data, isAdmin ? undefined : auth.id, isAdmin);
      return successResponse(appointment, "Appointment rescheduled");
    } catch (error) {
      return errorResponse(error instanceof Error ? error.message : "Reschedule failed");
    }
  }
);

export const DELETE = roleParamsHandler(
  [ROLES.SUPER_ADMIN, ROLES.PATIENT],
  async (auth, _request, id) => {
    try {
      const appointment = await cancelAppointment(id, auth.role === ROLES.SUPER_ADMIN ? undefined : auth.id, auth.role === ROLES.SUPER_ADMIN);
      return successResponse(appointment, "Appointment cancelled");
    } catch (error) {
      return errorResponse(error instanceof Error ? error.message : "Cancellation failed");
    }
  }
);
