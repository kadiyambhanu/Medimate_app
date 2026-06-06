"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Bell, Check, X, Clock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoader } from "@/components/shared/loading-spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/api";
import { formatTime } from "@/lib/utils";
import {
  DOSE_SLOTS,
  DOSE_SLOT_LABELS,
  getReminderDoseSlot,
  type DoseSlot,
} from "@/lib/time-period";
import { reminderSchema, type ReminderInput } from "@/validations/reminder";
import type { IReminder, IMedicine } from "@/types";

export function RemindersContent() {
  const searchParams = useSearchParams();
  const [reminders, setReminders] = useState<IReminder[]>([]);
  const [medicines, setMedicines] = useState<IMedicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [timeFilter, setTimeFilter] = useState<DoseSlot | "all">("all");

  const form = useForm<ReminderInput>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      medicineId: "",
      reminderTime: "08:00",
      scheduledDate: format(new Date(), "yyyy-MM-dd"),
      notes: "",
    },
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [remRes, medRes] = await Promise.all([
        api.get(`/reminders?date=${selectedDate}`),
        api.get("/medicines?status=active"),
      ]);
      setReminders(remRes.data.data);
      setMedicines(medRes.data.data?.items || medRes.data.data || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load reminders");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (searchParams.get("action") === "add") setDialogOpen(true);
  }, [searchParams]);

  const handleCreate = async (data: ReminderInput) => {
    setSubmitting(true);
    try {
      await api.post("/reminders", data);
      toast.success("Reminder created");
      setDialogOpen(false);
      form.reset();
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create reminder");
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id: string, status: "taken" | "missed" | "snoozed") => {
    try {
      await api.post(`/reminders/${id}/${status}`);
      toast.success(`Marked as ${status}`);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this reminder?")) return;
    try {
      await api.delete(`/reminders/${id}`);
      toast.success("Reminder deleted");
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const statusBadge = (status: string) => {
    const variants: Record<string, "success" | "destructive" | "warning" | "outline"> = {
      taken: "success", missed: "destructive", snoozed: "warning", pending: "outline",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const filteredReminders = reminders.filter((reminder) => {
    if (timeFilter === "all") return true;
    return getReminderDoseSlot(reminder) === timeFilter;
  });

  const periodCounts = DOSE_SLOTS.reduce(
    (acc, period) => {
      acc[period] = reminders.filter((r) => getReminderDoseSlot(r) === period).length;
      return acc;
    },
    {} as Record<DoseSlot, number>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reminders</h1>
          <p className="text-muted-foreground">Manage your daily medicine reminders</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4" /> Add Reminder</Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full sm:w-48"
        />
      </div>

      {reminders.length > 0 && (
        <Tabs
          value={timeFilter}
          onValueChange={(value) => setTimeFilter(value as DoseSlot | "all")}
        >
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1">
            <TabsTrigger value="all" className="text-xs sm:text-sm">
              All ({reminders.length})
            </TabsTrigger>
            {DOSE_SLOTS.map((period) => (
              <TabsTrigger key={period} value={period} className="text-xs sm:text-sm">
                {DOSE_SLOT_LABELS[period]} ({periodCounts[period]})
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {loading ? (
        <PageLoader />
      ) : reminders.length === 0 ? (
        <EmptyState icon={Bell} title="No reminders" description="Create reminders to never miss a dose." actionLabel="Add Reminder" onAction={() => setDialogOpen(true)} />
      ) : filteredReminders.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={`No ${timeFilter === "all" ? "" : DOSE_SLOT_LABELS[timeFilter].toLowerCase()} reminders`}
          description="Try another time filter or select a different date."
          actionLabel="Show All"
          onAction={() => setTimeFilter("all")}
        />
      ) : (
        <div className="space-y-3">
          {filteredReminders.map((reminder) => {
            const period = getReminderDoseSlot(reminder);
            const medicine = reminder.medicineId as IMedicine;

            return (
            <Card key={reminder._id.toString()}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Bell className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{medicine?.medicineName || "Medicine"}</p>
                      <Badge variant="secondary" className="text-xs">
                        {DOSE_SLOT_LABELS[period]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatTime(reminder.reminderTime)}
                      {medicine?.frequency ? ` · ${medicine.frequency}` : ""}
                      {medicine?.foodInstruction ? ` · ${medicine.foodInstruction}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {statusBadge(reminder.status)}
                  {reminder.status === "pending" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(reminder._id.toString(), "taken")}>
                        <Check className="h-4 w-4 text-emerald-600" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(reminder._id.toString(), "missed")}>
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(reminder._id.toString(), "snoozed")}>
                        <Clock className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(reminder._id.toString())}>
                    <Trash2 className="h-4 w-4 text-destructive" />
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
          <DialogHeader><DialogTitle>Create Reminder</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
            <div className="space-y-2">
              <Label>Medicine</Label>
              <Select value={form.watch("medicineId")} onValueChange={(v) => form.setValue("medicineId", v)}>
                <SelectTrigger><SelectValue placeholder="Select medicine" /></SelectTrigger>
                <SelectContent>
                  {medicines.map((m) => (
                    <SelectItem key={m._id.toString()} value={m._id.toString()}>{m.medicineName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input type="time" {...form.register("reminderTime")} />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" {...form.register("scheduledDate")} />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>Create Reminder</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
