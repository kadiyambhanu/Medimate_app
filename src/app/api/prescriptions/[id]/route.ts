import { NextRequest } from "next/server";
import { withAuthParams, successResponse, errorResponse } from "@/lib/api-helpers";
import Prescription from "@/models/Prescription";
import { deletePrescriptionWithDependents } from "@/services/prescription-cascade.service";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withAuthParams(request, context, async (userId, _req, id) => {
    const prescription = await Prescription.findOne({ _id: id, userId });
    if (!prescription) return errorResponse("Prescription not found", 404);
    return successResponse(prescription);
  });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withAuthParams(request, context, async (userId, _req, id) => {
    const result = await deletePrescriptionWithDependents(userId, id);
    if (!result) return errorResponse("Prescription not found", 404);

    const { medicinesRemoved } = result;
    const message =
      medicinesRemoved > 0
        ? `Prescription deleted with ${medicinesRemoved} linked medicine(s) and their reminders`
        : "Prescription deleted successfully";

    return successResponse({ medicinesRemoved }, message);
  });
}
