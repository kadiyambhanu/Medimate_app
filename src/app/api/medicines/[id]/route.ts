import { NextRequest } from "next/server";
import { withAuthParams, successResponse, errorResponse } from "@/lib/api-helpers";
import { medicineSchema } from "@/validations/medicine";
import Medicine from "@/models/Medicine";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withAuthParams(request, context, async (userId, _req, id) => {
    const medicine = await Medicine.findOne({ _id: id, userId });
    if (!medicine) return errorResponse("Medicine not found", 404);
    return successResponse(medicine);
  });
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withAuthParams(request, context, async (userId, req, id) => {
    const body = await req.json();
    const parsed = medicineSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message);
    }

    const medicine = await Medicine.findOneAndUpdate({ _id: id, userId }, parsed.data, { new: true });
    if (!medicine) return errorResponse("Medicine not found", 404);
    return successResponse(medicine, "Medicine updated successfully");
  });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withAuthParams(request, context, async (userId, _req, id) => {
    const medicine = await Medicine.findOneAndDelete({ _id: id, userId });
    if (!medicine) return errorResponse("Medicine not found", 404);
    return successResponse(null, "Medicine deleted successfully");
  });
}
