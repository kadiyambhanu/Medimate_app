"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Bell, Check, X, Clock, Trash2, Pill } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoader } from "@/components/shared/loading-spinner";
import { AdminPageShell } from "@/components/super-admin/page-shell";
import { PageHeader } from "@/components/super-admin/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/api";
import { formatTime } from "@/lib/utils";
import { buildMedicineLookup, buildMedicineReminderEntries } from "@/lib/medicine-utils";
import {
  DOSE_SLOTS,
  DOSE_SLOT_LABELS,
  countMedicinesForSlot,
  getReminderDoseSlot,
  type DoseSlot,
} from "@/lib/time-period";
import { reminderSchema, type ReminderInput } from "@/validations/reminder";
import type { IReminder, IMedicine } from "@/types";

function getReminderId(reminder: IReminder): string {
  const id = reminder._id;
  if (typeof id === "string") return id;
  return id?.toString?.() ?? "";
}

function MedicineTimingBadges({ medicine }: { medicine: IMedicine }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {Object.entries(medicine.timings)
        .filter(([, active]) => active)
        .map(([slot]) => (
          <Badge key={slot} variant="outline" className="text-xs capitalize">
            {slot}
          </Badge>
        ))}
    </div>
  );
}

interface ReminderDoseRowProps {
  reminder: IReminder;
  onTaken: (id: string) => void;
  onMissed: (id: string) => void;
  onSnooze: (id: string) => void;
  onDelete: (id: string) => void;
}

function ReminderDoseRow({ reminder, onTaken, onMissed, onSnooze, onDelete }: ReminderDoseRowProps) {
  const period = getReminderDoseSlot(reminder);
  const variants: Record<string, "success" | "destructive" | "warning" | "outline"> = {
    taken: "success",
    missed: "destructive",
    snoozed: "warning",
    pending: "outline",
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background">
          <Bell className="h-4 w-4 text-primary" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">{formatTime(reminder.reminderTime)}</p>
            <Badge variant="secondary" className="text-xs">
              {DOSE_SLOT_LABELS[period]}
            </Badge>
          </div>
          {reminder.notes && <p className="text-xs text-muted-foreground">{reminder.notes}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 self-end sm:self-center">
        <Badge variant={variants[reminder.status] || "outline"}>{reminder.status}</Badge>
        {reminder.status === "pending" && (
          <>
            <Button size="sm" variant="outline" onClick={() => onTaken(getReminderId(reminder))}>
              <Check className="h-4 w-4 text-emerald-600" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => onMissed(getReminderId(reminder))}>
              <X className="h-4 w-4 text-red-600" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => onSnooze(getReminderId(reminder))}>
              <Clock className="h-4 w-4" />
            </Button>
          </>
        )}
        <Button size="sm" variant="ghost" onClick={() => onDelete(getReminderId(reminder))}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

export function RemindersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [reminders, setReminders] = useState<IReminder[]>([]);
  const [medicines, setMedicines] = useState<IMedicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [timeFilter, setTimeFilter] = useState<DoseSlot | "all">("morning");

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
        api.get("/medicines?status=active&all=true"),
      ]);
      setReminders(remRes.data.data || []);
      setMedicines(medRes.data.data?.items || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load reminders");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (searchParams.get("action") === "add") setDialogOpen(true);
  }, [searchParams]);

  const medicineLookup = useMemo(() => buildMedicineLookup(medicines), [medicines]);

  const slotCounts = useMemo(
    () =>
      DOSE_SLOTS.reduce(
        (acc, slot) => {
          acc[slot] = countMedicinesForSlot(medicines, slot);
          return acc;
        },
        {} as Record<DoseSlot, number>
      ),
    [medicines]
  );

  const entriesBySlot = useMemo(() => {
    const all = buildMedicineReminderEntries(medicines, reminders, medicineLookup, "all");
    const morning = buildMedicineReminderEntries(medicines, reminders, medicineLookup, "morning");
    const afternoon = buildMedicineReminderEntries(medicines, reminders, medicineLookup, "afternoon");
    const night = buildMedicineReminderEntries(medicines, reminders, medicineLookup, "night");
    return { all, morning, afternoon, night };
  }, [medicines, reminders, medicineLookup]);

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
    if (!id || id === "undefined") {
      toast.error("Invalid reminder");
      return;
    }
    try {
      await api.put(`/reminders/${id}`, { status });
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

  const renderMedicineEntries = (entries: ReturnType<typeof buildMedicineReminderEntries>, slot: DoseSlot | "all") => {
    if (entries.length === 0) {
      return (
        <EmptyState
          icon={Bell}
          title={
            slot === "all"
              ? "No medicines to show"
              : `No ${DOSE_SLOT_LABELS[slot as DoseSlot].toLowerCase()} medicines`
          }
          description={
            slot === "all"
              ? "Add active medicines to see reminders here."
              : `None of your medicines are scheduled for ${DOSE_SLOT_LABELS[slot as DoseSlot].toLowerCase()}.`
          }
          actionLabel={slot === "all" ? "Go to Medicines" : "View All"}
          onAction={() => (slot === "all" ? router.push("/medicines") : setTimeFilter("all"))}
        />
      );
    }

    return (
      <div className="space-y-4">
        {entries.map(({ medicine, reminders: medicineReminders, scheduledTime }) => (
          <Card key={medicine._id.toString()} className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Pill className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base">{medicine.medicineName}</CardTitle>
                  {medicine.genericName && (
                    <p className="text-xs text-muted-foreground">{medicine.genericName}</p>
                  )}
                  <CardDescription className="mt-1">
                    {medicine.dosage}
                    {medicine.frequency ? ` · ${medicine.frequency}` : ""}
                    {medicine.foodInstruction ? ` · ${medicine.foodInstruction}` : ""}
                  </CardDescription>
                  <MedicineTimingBadges medicine={medicine} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {medicineReminders.length > 0 ? (
                medicineReminders.map((reminder) => (
                  <ReminderDoseRow
                    key={getReminderId(reminder)}
                    reminder={reminder}
                    onTaken={(id) => updateStatus(id, "taken")}
                    onMissed={(id) => updateStatus(id, "missed")}
                    onSnooze={(id) => updateStatus(id, "snoozed")}
                    onDelete={handleDelete}
                  />
                ))
              ) : scheduledTime ? (
                <div className="flex items-center justify-between rounded-lg border border-dashed bg-muted/10 p-3">
                  <div>
                    <p className="text-sm font-medium">{formatTime(scheduledTime)}</p>
                    <p className="text-xs text-muted-foreground">
                      Scheduled from medicine timings — dose will sync for this date
                    </p>
                  </div>
                  <Badge variant="outline">Pending</Badge>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No dose scheduled for this period.</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <AdminPageShell>
      <PageHeader
        title="Reminders"
        description="Doses by morning, afternoon, and night — based on your medicine timings"
        icon={Bell}
        badge={reminders.length || undefined}
      >
        <Button onClick={() => setDialogOpen(true)} disabled={medicines.length === 0}>
          <Plus className="mr-2 h-4 w-4" /> Add Reminder
        </Button>
      </PageHeader>

      <Card className="shadow-sm">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full sm:w-48"
          />
          <p className="text-sm text-muted-foreground">
            {medicines.length} active medicine{medicines.length === 1 ? "" : "s"} · {reminders.length} dose
            {reminders.length === 1 ? "" : "s"} today
          </p>
        </CardContent>
      </Card>

      {loading ? (
        <PageLoader />
      ) : medicines.length === 0 ? (
        <EmptyState
          icon={Pill}
          title="No active medicines"
          description="Add medicines with morning, afternoon, or night timings — reminders follow your medicine schedule."
          actionLabel="Go to Medicines"
          onAction={() => router.push("/medicines")}
        />
      ) : (
        <Tabs value={timeFilter} onValueChange={(value) => setTimeFilter(value as DoseSlot | "all")}>
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-4">
            {DOSE_SLOTS.map((slot) => (
              <TabsTrigger key={slot} value={slot} className="text-xs sm:text-sm">
                {DOSE_SLOT_LABELS[slot]} ({slotCounts[slot]})
              </TabsTrigger>
            ))}
            <TabsTrigger value="all" className="text-xs sm:text-sm">
              All ({medicines.length})
            </TabsTrigger>
          </TabsList>

          {DOSE_SLOTS.map((slot) => (
            <TabsContent key={slot} value={slot} className="mt-4">
              {renderMedicineEntries(entriesBySlot[slot], slot)}
            </TabsContent>
          ))}
          <TabsContent value="all" className="mt-4">
            {renderMedicineEntries(entriesBySlot.all, "all")}
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Reminder</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
            <div className="space-y-2">
              <Label>Medicine</Label>
              <Select value={form.watch("medicineId")} onValueChange={(v) => form.setValue("medicineId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select medicine" />
                </SelectTrigger>
                <SelectContent>
                  {medicines.map((medicine) => (
                    <SelectItem key={medicine._id.toString()} value={medicine._id.toString()}>
                      {medicine.medicineName} — {medicine.dosage}
                    </SelectItem>
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
            <Button type="submit" className="w-full" disabled={submitting || medicines.length === 0}>
              Create Reminder
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}
