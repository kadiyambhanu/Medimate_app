import { apiHandler, successResponse, errorResponse } from "@/lib/api-helpers";
import { familyMemberSchema } from "@/validations/family";
import FamilyMember from "@/models/FamilyMember";

export const GET = apiHandler(async (userId) => {
  const members = await FamilyMember.find({ userId }).sort({ createdAt: -1 });
  return successResponse(members);
});

export const POST = apiHandler(async (userId, request) => {
  const body = await request.json();
  const parsed = familyMemberSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0].message);
  }

  const member = await FamilyMember.create({ ...parsed.data, userId });
  return successResponse(member, "Family member added successfully", 201);
});
