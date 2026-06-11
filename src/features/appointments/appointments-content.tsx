"use client";

import { useCallback, useEffect, useState } from "react";
import { format, addDays } from "date-fns";
import { Calendar, X, RefreshCw, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoader } from "@/components/shared/loading-spinner";
import { AdminPageShell } from "@/components/super-admin/page-shell";
import { PageHeader } from "@/components/super-admin/page-header";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import api from "@/lib/api";
import type { IAppointment, IHospital, IDoctor } from "@/types";

type PopulatedAppointment = IAppointment & {
  hospitalId: IHospital;
  doctorId: IDoctor;
};

export function AppointmentsContent() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<PopulatedAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<PopulatedAppointment | null>(null);
  const [date, setDate] = useState("");
  const [slotTime, setSlotTime] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [hospitals, setHospitals] = useState<IHospital[]>([]);
  const [doctors, setDoctors] = useState<IDoctor[]>([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(false);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [createHospitalId, setCreateHospitalId] = useState("");
  const [createDoctorId, setCreateDoctorId] = useState("");
  const [createDate, setCreateDate] = useState(format(addDays(new Date(), 1), "yyyy-MM-dd"));
  const [createSlot, setCreateSlot] = useState("");
  const [createSlots, setCreateSlots] = useState<string[]>([]);
  const [createSlotsLoading, setCreateSlotsLoading] = useState(false);
  const [createNotes, setCreateNotes] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/appointments");
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

  const resetCreateForm = useCallback(() => {
    setCreateHospitalId("");
    setCreateDoctorId("");
    setDoctors([]);
    setCreateDate(format(addDays(new Date(), 1), "yyyy-MM-dd"));
    setCreateSlot("");
    setCreateSlots([]);
    setCreateNotes("");
    setPatientName(user?.name ?? "");
    setPatientEmail(user?.email ?? "");
    setPatientPhone(user?.phone ?? "");
  }, [user]);

  const openCreateDialog = () => {
    resetCreateForm();
    setCreateOpen(true);
  };

  useEffect(() => {
    if (!createOpen) return;
    setHospitalsLoading(true);
    api
      .get("/hospitals")
      .then((res) => setHospitals(res.data.data))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load hospitals"))
      .finally(() => setHospitalsLoading(false));
  }, [createOpen]);

  useEffect(() => {
    if (!createHospitalId) {
      setDoctors([]);
      setCreateDoctorId("");
      return;
    }
    setDoctorsLoading(true);
    setCreateDoctorId("");
    setCreateSlot("");
    setCreateSlots([]);
    api
      .get(`/doctors?hospitalId=${createHospitalId}`)
      .then((res) => setDoctors(res.data.data))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load doctors"))
      .finally(() => setDoctorsLoading(false));
  }, [createHospitalId]);

  useEffect(() => {
    if (!createDoctorId || !createDate) return;
    setCreateSlotsLoading(true);
    api
      .get(`/doctors/${createDoctorId}/slots?date=${createDate}`)
      .then((res) => {
        setCreateSlots(res.data.data);
        setCreateSlot("");
      })
      .catch(() => setCreateSlots([]))
      .finally(() => setCreateSlotsLoading(false));
  }, [createDoctorId, createDate]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      toast.error("Patient name is required");
      return;
    }
    if (!createHospitalId) {
      toast.error("Select a hospital");
      return;
    }
    if (!createDoctorId) {
      toast.error("Select a doctor");
      return;
    }
    if (!createSlot) {
      toast.error("Select a time slot");
      return;
    }
    setCreating(true);
    try {
      await api.post("/appointments", {
        hospitalId: createHospitalId,
        doctorId: createDoctorId,
        appointmentDate: createDate,
        slotTime: createSlot,
        notes: createNotes || undefined,
      });
      toast.success("Appointment booked successfully");
      setCreateOpen(false);
      fetchAppointments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setCreating(false);
    }
  };

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
      await api.delete(`/appointments/${id}`);
      toast.success("Appointment cancelled");
      fetchAppointments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cancellation failed");
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
    <AdminPageShell>
      <PageHeader
        title="My Appointments"
        description="View and manage your hospital appointments"
        icon={Calendar}
        badge={appointments.length || undefined}
      >
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Create Appointment
        </Button>
      </PageHeader>

      {appointments.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No appointments"
          description="Book an appointment with a hospital doctor"
          actionLabel="Create Appointment"
          onAction={openCreateDialog}
        />
      ) : (
        <div className="grid gap-4">
          {appointments.map((apt) => (
            <Card key={apt._id.toString()} className="shadow-sm">
              <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{apt.doctorId?.name}</h3>
                    <Badge variant={statusVariant(apt.status)}>{apt.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{apt.hospitalId?.hospitalName}</p>
                  <p className="text-sm">
                    {format(new Date(apt.appointmentDate), "EEEE, MMM d, yyyy")} at {apt.slotTime}
                  </p>
                  {apt.notes && <p className="text-sm text-muted-foreground">Note: {apt.notes}</p>}
                </div>
                {apt.status === "BOOKED" && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openReschedule(apt)}>
                      <RefreshCw className="mr-1 h-4 w-4" />
                      Reschedule
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleCancel(apt._id.toString())}>
                      <X className="mr-1 h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Appointment</DialogTitle>
            <DialogDescription>
              Enter patient details, select a hospital and doctor, then pick an available slot.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-5">
            <div className="space-y-3 rounded-lg border p-4">
              <h3 className="text-sm font-medium">Patient Details</h3>
              <div className="space-y-2">
                <Label htmlFor="patientName">Full Name</Label>
                <Input
                  id="patientName"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Patient full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patientEmail">Email</Label>
                <Input
                  id="patientEmail"
                  type="email"
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                  placeholder="Email address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patientPhone">Phone</Label>
                <Input
                  id="patientPhone"
                  type="tel"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  placeholder="Phone number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Hospital</Label>
              <Select value={createHospitalId} onValueChange={setCreateHospitalId} disabled={hospitalsLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={hospitalsLoading ? "Loading hospitals..." : "Select hospital"} />
                </SelectTrigger>
                <SelectContent>
                  {hospitals.map((hospital) => (
                    <SelectItem key={hospital._id.toString()} value={hospital._id.toString()}>
                      {hospital.hospitalName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Doctor</Label>
              <Select
                value={createDoctorId}
                onValueChange={setCreateDoctorId}
                disabled={!createHospitalId || doctorsLoading}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !createHospitalId
                        ? "Select a hospital first"
                        : doctorsLoading
                          ? "Loading doctors..."
                          : doctors.length === 0
                            ? "No doctors available"
                            : "Select doctor"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor._id.toString()} value={doctor._id.toString()}>
                      {doctor.name} — {doctor.specialization}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Appointment Date</Label>
              <Input
                type="date"
                value={createDate}
                min={format(new Date(), "yyyy-MM-dd")}
                onChange={(e) => setCreateDate(e.target.value)}
                disabled={!createDoctorId}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Time Slot</Label>
              {!createDoctorId ? (
                <p className="text-sm text-muted-foreground">Select a doctor to view available slots</p>
              ) : createSlotsLoading ? (
                <p className="text-sm text-muted-foreground">Loading slots...</p>
              ) : createSlots.length === 0 ? (
                <p className="text-sm text-muted-foreground">No slots available for this date</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {createSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setCreateSlot(slot)}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                        createSlot === slot
                          ? "border-primary bg-primary text-primary-foreground"
                          : "hover:bg-accent"
                      )}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={createNotes}
                onChange={(e) => setCreateNotes(e.target.value)}
                placeholder="Any symptoms or notes for the doctor..."
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full" disabled={creating || !createSlot}>
              {creating ? "Booking..." : "Book Appointment"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

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
    </AdminPageShell>
  );
}
