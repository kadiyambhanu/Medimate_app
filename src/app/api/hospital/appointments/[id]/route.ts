import { hospitalParamsHandler, successResponse, errorResponse } from "@/lib/api-helpers";
import { appointmentRescheduleSchema } from "@/validations/appointment";
import Appointment from "@/models/Appointment";
import { cancelAppointment, rescheduleAppointment } from "@/services/appointment.service";

export const PUT = hospitalParamsHandler(async (hospitalId, _auth, request, id) => {
  const appointment = await Appointment.findOne({ _id: id, hospitalId });
  if (!appointment) return errorResponse("Appointment not found", 404);

  const body = await request.json();

  if (body.status === "CANCELLED") {
    try {
      const result = await cancelAppointment(id, undefined, true);
      return successResponse(result, "Appointment cancelled");
    } catch (error) {
      return errorResponse(error instanceof Error ? error.message : "Cancellation failed");
    }
  }

  if (body.status === "COMPLETED") {
    appointment.status = "COMPLETED";
    await appointment.save();
    return successResponse(appointment, "Appointment marked completed");
  }

  const parsed = appointmentRescheduleSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

  try {
    const result = await rescheduleAppointment(id, parsed.data, undefined, true);
    return successResponse(result, "Appointment rescheduled");
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Reschedule failed");
  }
});
