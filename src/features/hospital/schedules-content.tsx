"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminPageShell } from "@/components/super-admin/page-shell";
import { PageHeader } from "@/components/super-admin/page-header";
import { DataCard } from "@/components/super-admin/data-card";
import { PageLoader } from "@/components/shared/loading-spinner";
import { WEEK_DAYS } from "@/lib/constants";
import api from "@/lib/api";
import type { IDoctor, IDoctorSchedule } from "@/types";

type ScheduleWithDoctor = IDoctorSchedule & { doctorId: IDoctor | string };

export function HospitalSchedulesContent() {
  const [doctors, setDoctors] = useState<IDoctor[]>([]);
  const [schedules, setSchedules] = useState<ScheduleWithDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctorId, setDoctorId] = useState("");
  const [form, setForm] = useState({
    availableDays: ["monday", "tuesday", "wednesday", "thursday", "friday"] as string[],
    startTime: "09:00",
    endTime: "17:00",
    slotDuration: 30,
    breakTime: "13:00",
  });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [doctorsRes, schedulesRes] = await Promise.all([
        api.get("/hospital/doctors"),
        api.get("/hospital/schedules"),
      ]);
      setDoctors(doctorsRes.data.data);
      setSchedules(schedulesRes.data.data);
      if (doctorsRes.data.data.length > 0 && !doctorId) {
        setDoctorId(doctorsRes.data.data[0]._id.toString());
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleDay = (day: string) => {
    const next = form.availableDays.includes(day)
      ? form.availableDays.filter((d) => d !== day)
      : [...form.availableDays, day];
    setForm({ ...form, availableDays: next });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId) return;
    setSaving(true);
    try {
      await api.post("/hospital/schedules", { doctorId, schedule: form });
      toast.success("Schedule saved");
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this schedule?")) return;
    try {
      await api.delete(`/hospital/schedules/${id}`);
      toast.success("Schedule deleted");
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  if (loading) return <PageLoader />;

  return (
    <AdminPageShell>
      <PageHeader
        title="Doctor Schedules"
        description="Configure availability and appointment slots"
        icon={Clock}
        badge={schedules.length}
      />

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-primary" />
            Add / Edit Schedule
          </CardTitle>
          <CardDescription>Set working days, hours, and slot duration for a doctor</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="space-y-2">
              <Label>Doctor</Label>
              <Select value={doctorId} onValueChange={setDoctorId}>
                <SelectTrigger className="max-w-sm"><SelectValue placeholder="Select doctor" /></SelectTrigger>
                <SelectContent>
                  {doctors.map((d) => (
                    <SelectItem key={d._id.toString()} value={d._id.toString()}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-3">
              {WEEK_DAYS.map((day) => (
                <label key={day} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm capitalize transition-colors hover:bg-muted/50">
                  <Checkbox checked={form.availableDays.includes(day)} onCheckedChange={() => toggleDay(day)} />
                  {day}
                </label>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Slot Duration (min)</Label>
                <Input type="number" value={form.slotDuration} onChange={(e) => setForm({ ...form, slotDuration: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Break Time</Label>
                <Input type="time" value={form.breakTime} onChange={(e) => setForm({ ...form, breakTime: e.target.value })} />
              </div>
            </div>
            <Button type="submit" disabled={saving || !doctorId}>
              {saving ? "Saving..." : "Save Schedule"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {schedules.length > 0 && (
        <DataCard title="Active Schedules" description="Configured doctor availability" count={schedules.length}>
          <div className="divide-y">
            {schedules.map((schedule) => {
              const doctor = typeof schedule.doctorId === "object" ? schedule.doctorId : null;
              return (
                <div key={schedule._id.toString()} className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0 space-y-1.5">
                    <p className="font-medium">{doctor?.name || "Doctor"}</p>
                    <p className="text-sm text-muted-foreground">
                      {schedule.startTime} – {schedule.endTime} · {schedule.slotDuration} min slots
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {schedule.availableDays.map((day) => (
                        <Badge key={day} variant="outline" className="capitalize text-xs font-normal">
                          {day}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(schedule._id.toString())}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </DataCard>
      )}
    </AdminPageShell>
  );
}
