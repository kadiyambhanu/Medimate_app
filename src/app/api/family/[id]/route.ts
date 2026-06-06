import { NextRequest } from "next/server";
import { withAuthParams, successResponse, errorResponse } from "@/lib/api-helpers";
import { familyMemberSchema } from "@/validations/family";
import FamilyMember from "@/models/FamilyMember";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withAuthParams(request, context, async (userId, _req, id) => {
    const member = await FamilyMember.findOne({ _id: id, userId });
    if (!member) return errorResponse("Family member not found", 404);
    return successResponse(member);
  });
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withAuthParams(request, context, async (userId, req, id) => {
    const body = await req.json();
    const parsed = familyMemberSchema.safeParse(body);

    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    const member = await FamilyMember.findOneAndUpdate({ _id: id, userId }, parsed.data, { new: true });
    if (!member) return errorResponse("Family member not found", 404);
    return successResponse(member, "Family member updated successfully");
  });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withAuthParams(request, context, async (userId, _req, id) => {
    const member = await FamilyMember.findOneAndDelete({ _id: id, userId });
    if (!member) return errorResponse("Family member not found", 404);
    return successResponse(null, "Family member removed successfully");
  });
}
