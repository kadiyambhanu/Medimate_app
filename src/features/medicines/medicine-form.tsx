"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { medicineSchema, type MedicineInput } from "@/validations/medicine";
import { MEDICINE_FREQUENCIES, FOOD_INSTRUCTIONS } from "@/lib/constants";
import type { IMedicine } from "@/types";

interface MedicineFormProps {
  defaultValues?: Partial<IMedicine>;
  isEditing?: boolean;
  onSubmit: (data: MedicineInput) => Promise<void>;
  loading?: boolean;
}

export function MedicineForm({ defaultValues, isEditing, onSubmit, loading }: MedicineFormProps) {
  const form = useForm<MedicineInput>({
    resolver: zodResolver(medicineSchema),
    defaultValues: {
      medicineName: defaultValues?.medicineName || "",
      genericName: defaultValues?.genericName || "",
      dosage: defaultValues?.dosage || "",
      quantity: defaultValues?.quantity || 1,
      frequency: defaultValues?.frequency || "Once Daily",
      timings: defaultValues?.timings || { morning: false, afternoon: false, evening: false, night: false },
      foodInstruction: defaultValues?.foodInstruction || "After Food",
      startDate: defaultValues?.startDate
        ? new Date(defaultValues.startDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      endDate: defaultValues?.endDate
        ? new Date(defaultValues.endDate).toISOString().split("T")[0]
        : "",
      notes: defaultValues?.notes || "",
      status: defaultValues?.status || "active",
    },
  });

  const timings = form.watch("timings");

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Medicine Name *</Label>
          <Input {...form.register("medicineName")} placeholder="e.g. Metformin" />
          {form.formState.errors.medicineName && (
            <p className="text-sm text-destructive">{form.formState.errors.medicineName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Generic Name</Label>
          <Input {...form.register("genericName")} placeholder="e.g. Metformin HCl" />
        </div>
        <div className="space-y-2">
          <Label>Dosage *</Label>
          <Input {...form.register("dosage")} placeholder="e.g. 500mg" />
          {form.formState.errors.dosage && (
            <p className="text-sm text-destructive">{form.formState.errors.dosage.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Quantity *</Label>
          <Input type="number" {...form.register("quantity", { valueAsNumber: true })} min={1} />
        </div>
        <div className="space-y-2">
          <Label>Frequency *</Label>
          <Select value={form.watch("frequency")} onValueChange={(v) => form.setValue("frequency", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {MEDICINE_FREQUENCIES.map((f) => (
                <SelectItem key={f} value={f}>{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Food Instruction</Label>
          <Select value={form.watch("foodInstruction")} onValueChange={(v) => form.setValue("foodInstruction", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {FOOD_INSTRUCTIONS.map((f) => (
                <SelectItem key={f} value={f}>{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Start Date *</Label>
          <Input type="date" {...form.register("startDate")} />
        </div>
        <div className="space-y-2">
          <Label>End Date</Label>
          <Input type="date" {...form.register("endDate")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Timings</Label>
        <div className="flex flex-wrap gap-4">
          {(["morning", "afternoon", "evening", "night"] as const).map((time) => (
            <label key={time} className="flex items-center gap-2">
              <Checkbox
                checked={timings[time]}
                onCheckedChange={(checked) =>
                  form.setValue(`timings.${time}`, !!checked)
                }
              />
              <span className="text-sm capitalize">{time}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea {...form.register("notes")} placeholder="Additional notes..." rows={3} />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading && <Loader2 className="animate-spin" />}
        {isEditing ? "Update Medicine" : "Add Medicine"}
      </Button>
    </form>
  );
}
