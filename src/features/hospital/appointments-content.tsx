"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { Calendar, Search, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoader } from "@/components/shared/loading-spinner";
import api from "@/lib/api";

export function HospitalAppointmentsContent() {
  const [appointments, setAppointments] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  const [date, setDate] = useState("");
  const [slotTime, setSlotTime] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await api.get(`/hospital/appointments?${params}`);
      setAppointments(res.data.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const openReschedule = (apt: Record<string, unknown>) => {
    setSelected(apt);
    setDate(format(new Date(String(apt.appointmentDate)), "yyyy-MM-dd"));
    setSlotTime(String(apt.slotTime));
    setRescheduleOpen(true);
  };

  useEffect(() => {
    if (!selected || !date) return;
    const doctor = selected.doctorId as { _id?: string };
    if (!doctor?._id) return;
    api.get(`/doctors/${doctor._id}/slots?date=${date}`).then((res) => setSlots(res.data.data)).catch(() => setSlots([]));
  }, [selected, date]);

  const updateStatus = async (id: string, status: string, body?: Record<string, unknown>) => {
    try {
      await api.put(`/hospital/appointments/${id}`, body ?? { status });
      toast.success(`Appointment ${status.toLowerCase()}`);
      fetchAppointments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  };

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    try {
      await api.put(`/hospital/appointments/${String(selected._id)}`, { appointmentDate: date, slotTime });
      toast.success("Appointment rescheduled");
      setRescheduleOpen(false);
      fetchAppointments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reschedule failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Appointments</h1>
          <p className="text-muted-foreground">Manage patient appointments</p>
        </div>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search patients..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {appointments.length === 0 ? (
        <EmptyState icon={Calendar} title="No appointments" description="Appointments will appear here" />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((apt) => {
                const user = apt.userId as { name?: string } | null;
                const doctor = apt.doctorId as { name?: string } | null;
                return (
                  <TableRow key={String(apt._id)}>
                    <TableCell>{user?.name}</TableCell>
                    <TableCell>{doctor?.name}</TableCell>
                    <TableCell>{format(new Date(String(apt.appointmentDate)), "MMM d, yyyy")}</TableCell>
                    <TableCell>{String(apt.slotTime)}</TableCell>
                    <TableCell><Badge>{String(apt.status)}</Badge></TableCell>
                    <TableCell className="text-right">
                      {apt.status === "BOOKED" && (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => openReschedule(apt)}><RefreshCw className="h-4 w-4" /></Button>
                          <Button size="sm" variant="outline" onClick={() => updateStatus(String(apt._id), "COMPLETED")}>Complete</Button>
                          <Button size="sm" variant="destructive" onClick={() => updateStatus(String(apt._id), "CANCELLED")}><X className="h-4 w-4" /></Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reschedule Appointment</DialogTitle></DialogHeader>
          <form onSubmit={handleReschedule} className="space-y-4">
            <div className="space-y-2"><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></div>
            <div className="space-y-2">
              <Label>Slot</Label>
              <Select value={slotTime} onValueChange={setSlotTime}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{slots.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>{submitting ? "Saving..." : "Reschedule"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
