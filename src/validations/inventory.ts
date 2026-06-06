import { z } from "zod";

export const inventorySchema = z.object({
  medicineId: z.string().min(1, "Medicine is required"),
  currentStock: z.number().min(0, "Stock cannot be negative"),
  unit: z.string().min(1, "Unit is required"),
  lowStockThreshold: z.number().min(1, "Threshold must be at least 1"),
  notes: z.string().optional(),
});

export const inventoryUpdateSchema = inventorySchema.partial().omit({ medicineId: true });

export type InventoryInput = z.infer<typeof inventorySchema>;
export type InventoryUpdateInput = z.infer<typeof inventoryUpdateSchema>;
