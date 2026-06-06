import { apiHandler, successResponse, errorResponse } from "@/lib/api-helpers";
import { prescriptionSchema } from "@/validations/prescription";
import Prescription from "@/models/Prescription";

export const GET = apiHandler(async (userId) => {
  const prescriptions = await Prescription.find({ userId }).sort({ uploadedAt: -1 });
  return successResponse(prescriptions);
});

export const POST = apiHandler(async (userId, request) => {
  const body = await request.json();
  const parsed = prescriptionSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0].message);
  }

  const prescription = await Prescription.create({ ...parsed.data, userId });
  return successResponse(prescription, "Prescription uploaded successfully", 201);
});
