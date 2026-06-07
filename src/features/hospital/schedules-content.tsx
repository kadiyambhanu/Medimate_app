"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Doctor Schedules</h1>
        <p className="text-muted-foreground">Configure availability and appointment slots</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" />Add / Edit Schedule</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Doctor</Label>
              <Select value={doctorId} onValueChange={setDoctorId}>
                <SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger>
                <SelectContent>
                  {doctors.map((d) => <SelectItem key={d._id.toString()} value={d._id.toString()}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-3">
              {WEEK_DAYS.map((day) => (
                <label key={day} className="flex items-center gap-2 text-sm capitalize">
                  <Checkbox checked={form.availableDays.includes(day)} onCheckedChange={() => toggleDay(day)} />
                  {day}
                </label>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Start Time</Label><Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></div>
              <div className="space-y-2"><Label>End Time</Label><Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></div>
              <div className="space-y-2"><Label>Slot Duration (min)</Label><Input type="number" value={form.slotDuration} onChange={(e) => setForm({ ...form, slotDuration: Number(e.target.value) })} /></div>
              <div className="space-y-2"><Label>Break Time</Label><Input type="time" value={form.breakTime} onChange={(e) => setForm({ ...form, breakTime: e.target.value })} /></div>
            </div>
            <Button type="submit" disabled={saving || !doctorId}>{saving ? "Saving..." : "Save Schedule"}</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {schedules.map((schedule) => {
          const doctor = typeof schedule.doctorId === "object" ? schedule.doctorId : null;
          return (
            <Card key={schedule._id.toString()}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{doctor?.name || "Doctor"}</p>
                  <p className="text-sm text-muted-foreground">
                    {schedule.startTime} - {schedule.endTime} · {schedule.slotDuration}min slots
                  </p>
                  <p className="text-sm capitalize">{schedule.availableDays.join(", ")}</p>
                </div>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(schedule._id.toString())}>Delete</Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
