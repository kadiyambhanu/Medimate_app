import { hospitalHandler, successResponse } from "@/lib/api-helpers";
import Prescription from "@/models/Prescription";
import Appointment from "@/models/Appointment";

export const GET = hospitalHandler(async (hospitalId) => {
  const appointments = await Appointment.find({ hospitalId }).select("_id").lean();
  const appointmentIds = appointments.map((a) => a._id);

  const prescriptions = await Prescription.find({
    $or: [{ appointmentId: { $in: appointmentIds } }],
  })
    .populate("userId", "name email")
    .populate("doctorId", "name")
    .populate("appointmentId")
    .sort({ uploadedAt: -1 })
    .lean();

  return successResponse(prescriptions);
});
