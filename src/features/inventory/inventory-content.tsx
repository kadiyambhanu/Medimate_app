"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Package, AlertTriangle, Edit } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoader } from "@/components/shared/loading-spinner";
import api from "@/lib/api";
import { inventorySchema, type InventoryInput } from "@/validations/inventory";
import type { IInventory, IMedicine } from "@/types";

interface InventoryData {
  items: IInventory[];
  lowStockCount: number;
  lowStock: IInventory[];
}

export function InventoryContent() {
  const [data, setData] = useState<InventoryData | null>(null);
  const [medicines, setMedicines] = useState<IMedicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<IInventory | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<InventoryInput>({
    resolver: zodResolver(inventorySchema),
    defaultValues: { medicineId: "", currentStock: 0, unit: "tablets", lowStockThreshold: 10 },
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, medRes] = await Promise.all([
        api.get("/inventory"),
        api.get("/medicines?status=active"),
      ]);
      setData(invRes.data.data);
      setMedicines(medRes.data.data?.items || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (formData: InventoryInput) => {
    setSubmitting(true);
    try {
      await api.post("/inventory", formData);
      toast.success("Inventory item added");
      setDialogOpen(false);
      form.reset();
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (id: string, currentStock: number) => {
    try {
      await api.put(`/inventory/${id}`, { currentStock });
      toast.success("Stock updated");
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  };

  const getMedicineId = (medicineId: IInventory["medicineId"]) =>
    typeof medicineId === "object" && medicineId !== null
      ? medicineId._id.toString()
      : String(medicineId);

  const openEdit = (item: IInventory) => {
    setEditItem(item);
    form.reset({
      medicineId: getMedicineId(item.medicineId),
      currentStock: item.currentStock,
      unit: item.unit,
      lowStockThreshold: item.lowStockThreshold,
      notes: item.notes || "",
    });
    setDialogOpen(true);
  };

  const handleEditSubmit = async (formData: InventoryInput) => {
    if (!editItem) return;
    setSubmitting(true);
    try {
      await api.put(`/inventory/${editItem._id}`, {
        currentStock: formData.currentStock,
        unit: formData.unit,
        lowStockThreshold: formData.lowStockThreshold,
        notes: formData.notes,
      });
      toast.success("Inventory updated");
      setDialogOpen(false);
      setEditItem(null);
      form.reset();
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Medicine Inventory</h1>
          <p className="text-muted-foreground">Track stock levels and low-stock alerts</p>
        </div>
        <Button onClick={() => { setEditItem(null); form.reset(); setDialogOpen(true); }}>
          <Plus className="h-4 w-4" /> Add Stock
        </Button>
      </div>

      {data && data.lowStockCount > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <p className="text-sm">
              <span className="font-semibold">{data.lowStockCount}</span> medicine(s) are running low on stock.
            </p>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <PageLoader />
      ) : !data?.items.length ? (
        <EmptyState
          icon={Package}
          title="No inventory items"
          description="Add medicines to your inventory to track stock and receive low-stock alerts."
          actionLabel="Add Stock"
          onAction={() => setDialogOpen(true)}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((item) => {
            const isLow = item.currentStock <= item.lowStockThreshold;
            return (
              <Card key={item._id.toString()} className={isLow ? "border-destructive/40" : ""}>
                <CardContent className="p-5">
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{item.medicineName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.currentStock} {item.unit} remaining
                      </p>
                    </div>
                    {isLow ? (
                      <Badge variant="destructive">Low Stock</Badge>
                    ) : (
                      <Badge variant="success">In Stock</Badge>
                    )}
                  </div>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Alert threshold: {item.lowStockThreshold} {item.unit}
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min={0}
                      defaultValue={item.currentStock}
                      className="h-8"
                      onBlur={(e) => {
                        const val = Number(e.target.value);
                        if (val !== item.currentStock) handleUpdate(item._id.toString(), val);
                      }}
                    />
                    <Button size="sm" variant="outline" onClick={() => openEdit(item)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? "Update Inventory" : "Add to Inventory"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(editItem ? handleEditSubmit : handleCreate)}
            className="space-y-4"
          >
            {!editItem && (
              <div className="space-y-2">
                <Label>Medicine</Label>
                <Select value={form.watch("medicineId")} onValueChange={(v) => form.setValue("medicineId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select medicine" /></SelectTrigger>
                  <SelectContent>
                    {medicines.map((m) => (
                      <SelectItem key={m._id.toString()} value={m._id.toString()}>
                        {m.medicineName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Current Stock</Label>
                <Input type="number" min={0} {...form.register("currentStock", { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Input {...form.register("unit")} placeholder="tablets" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Low Stock Threshold</Label>
              <Input type="number" min={1} {...form.register("lowStockThreshold", { valueAsNumber: true })} />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {editItem ? "Update" : "Add to Inventory"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
