import { roleHandler, successResponse } from "@/lib/api-helpers";
import { ROLES } from "@/lib/constants";
import Prescription from "@/models/Prescription";

export const GET = roleHandler([ROLES.SUPER_ADMIN], async () => {
  const prescriptions = await Prescription.find()
    .populate("userId", "name email")
    .populate("doctorId", "name")
    .populate("appointmentId")
    .sort({ uploadedAt: -1 })
    .lean();
  return successResponse(prescriptions);
});
