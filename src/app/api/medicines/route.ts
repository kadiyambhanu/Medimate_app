import { NextRequest } from "next/server";
import { apiHandler, successResponse, errorResponse } from "@/lib/api-helpers";
import { medicineSchema } from "@/validations/medicine";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import Medicine from "@/models/Medicine";

export const GET = apiHandler(async (userId, request) => {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const skip = (page - 1) * ITEMS_PER_PAGE;

  const filter: Record<string, unknown> = { userId };
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { medicineName: { $regex: search, $options: "i" } },
      { genericName: { $regex: search, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    Medicine.find(filter).sort({ createdAt: -1 }).skip(skip).limit(ITEMS_PER_PAGE),
    Medicine.countDocuments(filter),
  ]);

  return successResponse({
    items,
    total,
    page,
    totalPages: Math.ceil(total / ITEMS_PER_PAGE),
  });
});

export const POST = apiHandler(async (userId, request) => {
  const body = await request.json();
  const parsed = medicineSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0].message);
  }

  const medicine = await Medicine.create({ ...parsed.data, userId });
  return successResponse(medicine, "Medicine added successfully", 201);
});
