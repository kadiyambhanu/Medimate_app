"use client";

import { useCallback, useEffect, useState } from "react";
import { Calendar, X, RefreshCw } from "lucide-react";
import { format } from "date-fns";
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
import type { IAppointment, IUser, IHospital, IDoctor } from "@/types";

type PopulatedAppointment = IAppointment & {
  userId: IUser;
  hospitalId: IHospital;
  doctorId: IDoctor;
};

export function AppointmentsAdminContent() {
  const [appointments, setAppointments] = useState<PopulatedAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [selected, setSelected] = useState<PopulatedAppointment | null>(null);
  const [date, setDate] = useState("");
  const [slotTime, setSlotTime] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/appointments?admin=true");
      setAppointments(res.data.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const openReschedule = (appointment: PopulatedAppointment) => {
    setSelected(appointment);
    setDate(format(new Date(appointment.appointmentDate), "yyyy-MM-dd"));
    setSlotTime(appointment.slotTime);
    setRescheduleOpen(true);
  };

  useEffect(() => {
    if (!selected || !date) return;
    api
      .get(`/doctors/${selected.doctorId._id}/slots?date=${date}`)
      .then((res) => setSlots(res.data.data))
      .catch(() => setSlots([]));
  }, [selected, date]);

  const handleCancel = async (id: string) => {
    if (!confirm("Cancel this appointment?")) return;
    try {
      await api.put(`/appointments/${id}`, { status: "CANCELLED" });
      toast.success("Appointment cancelled");
      fetchAppointments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cancellation failed");
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await api.put(`/appointments/${id}`, { status: "COMPLETED" });
      toast.success("Appointment marked completed");
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
      await api.put(`/appointments/${selected._id}`, { appointmentDate: date, slotTime });
      toast.success("Appointment rescheduled");
      setRescheduleOpen(false);
      fetchAppointments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reschedule failed");
    } finally {
      setSubmitting(false);
    }
  };

  const statusVariant = (status: string) => {
    if (status === "BOOKED") return "default";
    if (status === "COMPLETED") return "secondary";
    return "destructive";
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Appointment Management</h1>
        <p className="text-muted-foreground">View, cancel, and reschedule appointments</p>
      </div>

      {appointments.length === 0 ? (
        <EmptyState icon={Calendar} title="No appointments" description="Appointments will appear here" />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Hospital</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((apt) => (
                <TableRow key={apt._id.toString()}>
                  <TableCell>{apt.userId?.name}</TableCell>
                  <TableCell>{apt.hospitalId?.hospitalName}</TableCell>
                  <TableCell>{apt.doctorId?.name}</TableCell>
                  <TableCell>{format(new Date(apt.appointmentDate), "MMM d, yyyy")}</TableCell>
                  <TableCell>{apt.slotTime}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(apt.status)}>{apt.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {apt.status === "BOOKED" && (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openReschedule(apt)}>
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleComplete(apt._id.toString())}>
                          Complete
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleCancel(apt._id.toString())}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReschedule} className="space-y-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Time Slot</Label>
              <Select value={slotTime} onValueChange={setSlotTime}>
                <SelectTrigger><SelectValue placeholder="Select slot" /></SelectTrigger>
                <SelectContent>
                  {slots.map((slot) => (
                    <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Saving..." : "Reschedule"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
