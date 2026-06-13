"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { Calendar, X, RefreshCw, Plus, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoader } from "@/components/shared/loading-spinner";
import { AdminPageShell } from "@/components/super-admin/page-shell";
import { PageHeader } from "@/components/super-admin/page-header";
import { CreateAppointmentDialog } from "@/features/appointments/create-appointment-dialog";
import { PaymentReceiptDialog } from "@/components/shared/payment-receipt-dialog";
import api from "@/lib/api";
import type { IAppointment, IHospital, IDoctor, PaymentReceiptData } from "@/types";
import { buildPaymentReceiptFromAppointment } from "@/utils/payment-receipt";

type PopulatedAppointment = IAppointment & {
  hospitalId: IHospital;
  doctorId: IDoctor;
};

export function AppointmentsContent() {
  const [appointments, setAppointments] = useState<PopulatedAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<PopulatedAppointment | null>(null);
  const [filterDate, setFilterDate] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [slotTime, setSlotTime] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receipt, setReceipt] = useState<PaymentReceiptData | null>(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterDate) params.set("date", filterDate);
      const res = await api.get(`/appointments?${params}`);
      setAppointments(res.data.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }, [filterDate]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const openCreateDialog = () => setCreateOpen(true);

  const openReschedule = (appointment: PopulatedAppointment) => {
    setSelected(appointment);
    setRescheduleDate(format(new Date(appointment.appointmentDate), "yyyy-MM-dd"));
    setSlotTime(appointment.slotTime);
    setRescheduleOpen(true);
  };

  useEffect(() => {
    if (!selected || !rescheduleDate) return;
    api
      .get(`/doctors/${selected.doctorId._id}/slots?date=${rescheduleDate}`)
      .then((res) => setSlots(res.data.data))
      .catch(() => setSlots([]));
  }, [selected, rescheduleDate]);

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
      await api.put(`/appointments/${selected._id}`, { appointmentDate: rescheduleDate, slotTime });
      toast.success("Appointment rescheduled");
      setRescheduleOpen(false);
      fetchAppointments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reschedule failed");
    } finally {
      setSubmitting(false);
    }
  };

  const paymentMethodLabel = (method?: string) => {
    if (method === "UPI") return "UPI";
    if (method === "PAY_AT_HOSPITAL") return "Pay at Hospital";
    return method;
  };

  const openReceipt = (apt: PopulatedAppointment) => {
    const data = buildPaymentReceiptFromAppointment(apt as unknown as Record<string, unknown>);
    if (data) {
      setReceipt(data);
      setReceiptOpen(true);
    }
  };

  const statusVariant = (status: string) => {
    if (status === "BOOKED") return "default";
    if (status === "COMPLETED") return "secondary";
    return "destructive";
  };

  if (loading && appointments.length === 0 && !filterDate) return <PageLoader />;

  return (
    <AdminPageShell>
      <PageHeader
        title="My Appointments"
        description="View and manage your hospital appointments"
        icon={Calendar}
        badge={appointments.length || undefined}
      >
        <Input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="h-9 w-40"
          aria-label="Filter appointments by date"
        />
        {filterDate && (
          <Button variant="ghost" size="sm" onClick={() => setFilterDate("")}>
            Clear
          </Button>
        )}
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Create Appointment
        </Button>
      </PageHeader>

      {loading ? (
        <PageLoader />
      ) : appointments.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={filterDate ? "No appointments on this date" : "No appointments"}
          description={
            filterDate
              ? `No appointments found for ${format(new Date(filterDate), "MMMM d, yyyy")}`
              : "Book an appointment with a hospital doctor"
          }
          actionLabel={filterDate ? undefined : "Create Appointment"}
          onAction={filterDate ? undefined : openCreateDialog}
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
                  {apt.patientDetails && (
                    <p className="text-sm text-muted-foreground">
                      Patient: {apt.patientDetails.name}
                      {apt.patientDetails.gender && ` · ${apt.patientDetails.gender}`}
                      {apt.patientDetails.diseaseName && ` · ${apt.patientDetails.diseaseName}`}
                    </p>
                  )}
                  {apt.notes && <p className="text-sm text-muted-foreground">Note: {apt.notes}</p>}
                  {apt.consultationFee != null && apt.consultationFee > 0 && (
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span>
                        Appointment fee: ₹{apt.consultationFee}
                        {apt.paymentMethod && (
                          <span className="text-muted-foreground"> · {paymentMethodLabel(apt.paymentMethod)}</span>
                        )}
                      </span>
                      {apt.paymentStatus === "COMPLETED" && (
                        <Badge variant="secondary">Paid</Badge>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                {apt.paymentStatus === "COMPLETED" && apt.paymentReceiptId && (
                  <Button size="sm" variant="outline" onClick={() => openReceipt(apt)}>
                    <Download className="mr-1 h-4 w-4" />
                    Receipt
                  </Button>
                )}
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateAppointmentDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={fetchAppointments}
      />

      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReschedule} className="space-y-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} required />
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

      <PaymentReceiptDialog
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        receipt={receipt}
      />
    </AdminPageShell>
  );
}
