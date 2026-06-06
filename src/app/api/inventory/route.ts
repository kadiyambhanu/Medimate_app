import { apiHandler, successResponse, errorResponse } from "@/lib/api-helpers";
import { inventorySchema } from "@/validations/inventory";
import Inventory from "@/models/Inventory";
import Medicine from "@/models/Medicine";
import Notification from "@/models/Notification";

export const GET = apiHandler(async (userId) => {
  const items = await Inventory.find({ userId })
    .populate("medicineId", "medicineName dosage status")
    .sort({ updatedAt: -1 });

  const lowStock = items.filter((item) => item.currentStock <= item.lowStockThreshold);

  return successResponse({ items, lowStockCount: lowStock.length, lowStock });
});

export const POST = apiHandler(async (userId, request) => {
  const body = await request.json();
  const parsed = inventorySchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0].message);
  }

  const medicine = await Medicine.findOne({ _id: parsed.data.medicineId, userId });
  if (!medicine) return errorResponse("Medicine not found", 404);

  const existing = await Inventory.findOne({ userId, medicineId: parsed.data.medicineId });
  if (existing) return errorResponse("Inventory entry already exists for this medicine");

  const item = await Inventory.create({
    userId,
    medicineId: parsed.data.medicineId,
    medicineName: medicine.medicineName,
    currentStock: parsed.data.currentStock,
    unit: parsed.data.unit,
    lowStockThreshold: parsed.data.lowStockThreshold,
    notes: parsed.data.notes,
    lastRestockedAt: new Date(),
  });

  if (item.currentStock <= item.lowStockThreshold) {
    await Notification.create({
      userId,
      title: "Low Stock Alert",
      message: `${medicine.medicineName} stock is low (${item.currentStock} ${item.unit} remaining).`,
      type: "system",
    });
  }

  return successResponse(item, "Inventory item created", 201);
});
