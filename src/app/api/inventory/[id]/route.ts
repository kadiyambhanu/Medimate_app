import { NextRequest } from "next/server";
import { withAuthParams, successResponse, errorResponse } from "@/lib/api-helpers";
import { inventoryUpdateSchema } from "@/validations/inventory";
import Inventory from "@/models/Inventory";
import Notification from "@/models/Notification";

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withAuthParams(request, context, async (userId, req, id) => {
    const body = await req.json();
    const parsed = inventoryUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message);
    }

    const update: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.currentStock !== undefined) {
      update.lastRestockedAt = new Date();
    }

    const item = await Inventory.findOneAndUpdate({ _id: id, userId }, update, { new: true }).populate(
      "medicineId",
      "medicineName dosage status"
    );

    if (!item) return errorResponse("Inventory item not found", 404);

    if (item.currentStock <= item.lowStockThreshold) {
      await Notification.create({
        userId,
        title: "Low Stock Alert",
        message: `${item.medicineName} stock is low (${item.currentStock} ${item.unit} remaining).`,
        type: "system",
      });
    }

    return successResponse(item, "Inventory updated successfully");
  });
}
