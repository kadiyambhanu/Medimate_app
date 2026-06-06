import { NextRequest } from "next/server";
import { withAuthParams, successResponse, errorResponse } from "@/lib/api-helpers";
import Prescription from "@/models/Prescription";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withAuthParams(request, context, async (userId, _req, id) => {
    const prescription = await Prescription.findOne({ _id: id, userId });
    if (!prescription) return errorResponse("Prescription not found", 404);
    return successResponse(prescription);
  });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withAuthParams(request, context, async (userId, _req, id) => {
    const prescription = await Prescription.findOneAndDelete({ _id: id, userId });
    if (!prescription) return errorResponse("Prescription not found", 404);
    return successResponse(null, "Prescription deleted successfully");
  });
}
