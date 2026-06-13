"use client";

import { useCallback, useEffect, useState } from "react";
import { differenceInYears, format } from "date-fns";
import { Calendar, Search, X, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminPageShell } from "@/components/super-admin/page-shell";
import { PageHeader } from "@/components/super-admin/page-header";
import { DataCard } from "@/components/super-admin/data-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoader } from "@/components/shared/loading-spinner";
import { InfoRow } from "@/components/super-admin/info-row";
import { Separator } from "@/components/ui/separator";
import api from "@/lib/api";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  BOOKED: "default",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
};

function paymentMethodLabel(method?: string) {
  if (method === "UPI") return "UPI";
  if (method === "PAY_AT_HOSPITAL") return "Pay at Hospital";
  return method || "—";
}

function formatPatientAge(dateOfBirth?: string | Date) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const age = differenceInYears(new Date(), dob);
  return age >= 0 ? age : null;
}

export function HospitalAppointmentsContent() {
  const [appointments, setAppointments] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [slotTime, setSlotTime] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ date: filterDate });
      if (search) params.set("search", search);
      const res = await api.get(`/hospital/appointments?${params}`);
      setAppointments(res.data.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }, [search, filterDate]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const openReschedule = (apt: Record<string, unknown>) => {
    setSelected(apt);
    setRescheduleDate(format(new Date(String(apt.appointmentDate)), "yyyy-MM-dd"));
    setSlotTime(String(apt.slotTime));
    setRescheduleOpen(true);
  };

  const openDetails = (apt: Record<string, unknown>) => {
    setSelected(apt);
    setDetailsOpen(true);
  };

  useEffect(() => {
    if (!selected || !rescheduleDate) return;
    const doctor = selected.doctorId as { _id?: string };
    if (!doctor?._id) return;
    api.get(`/doctors/${doctor._id}/slots?date=${rescheduleDate}`).then((res) => setSlots(res.data.data)).catch(() => setSlots([]));
  }, [selected, rescheduleDate]);

  const updateStatus = async (id: string, status: string, body?: Record<string, unknown>) => {
    try {
      await api.put(`/hospital/appointments/${id}`, body ?? { status });
      toast.success(`Appointment ${status.toLowerCase()}`);
      fetchAppointments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this appointment permanently? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await api.delete(`/hospital/appointments/${id}`);
      toast.success("Appointment deleted");
      if (selected && String(selected._id) === id) {
        setDetailsOpen(false);
        setSelected(null);
      }
      fetchAppointments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    try {
      await api.put(`/hospital/appointments/${String(selected._id)}`, { appointmentDate: rescheduleDate, slotTime });
      toast.success("Appointment rescheduled");
      setRescheduleOpen(false);
      fetchAppointments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reschedule failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && appointments.length === 0) return <PageLoader />;

  const bookedCount = appointments.filter((a) => a.status === "BOOKED").length;
  const filterDateLabel = format(new Date(filterDate), "MMMM d, yyyy");

  return (
    <AdminPageShell>
      <PageHeader
        title="Appointments"
        description="Manage patient appointments and bookings"
        icon={Calendar}
        badge={appointments.length}
      >
        <Input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="h-9 w-40"
          aria-label="Filter appointments by date"
        />
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search patients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </PageHeader>

      {appointments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="px-3 py-1">{bookedCount} booked</Badge>
          <Badge variant="outline" className="px-3 py-1">{appointments.length - bookedCount} other</Badge>
        </div>
      )}

      {loading ? (
        <PageLoader />
      ) : appointments.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No appointments on this date"
          description={`No appointments found for ${filterDateLabel}`}
        />
      ) : (
        <DataCard title={`Appointments — ${filterDateLabel}`} description="Patient visits for the selected date" count={appointments.length}>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Patient</TableHead>
                  <TableHead>Condition</TableHead>
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
                  const patient = apt.patientDetails as {
                    name?: string;
                    diseaseName?: string;
                  } | null;
                  const status = String(apt.status);
                  return (
                    <TableRow
                      key={String(apt._id)}
                      className="cursor-pointer"
                      onClick={() => openDetails(apt)}
                    >
                      <TableCell className="font-medium">{patient?.name || user?.name || "—"}</TableCell>
                      <TableCell>{patient?.diseaseName || "—"}</TableCell>
                      <TableCell>{doctor?.name || "—"}</TableCell>
                      <TableCell>{format(new Date(String(apt.appointmentDate)), "MMM d, yyyy")}</TableCell>
                      <TableCell>{String(apt.slotTime)}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[status] ?? "outline"}>{status}</Badge>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1.5">
                          {apt.status === "BOOKED" && (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => openReschedule(apt)} title="Reschedule">
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => updateStatus(String(apt._id), "COMPLETED")}>
                                Complete
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => updateStatus(String(apt._id), "CANCELLED")}
                                title="Cancel"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(String(apt._id))}
                            disabled={deleting}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </DataCard>
      )}

      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>Pick a new date and available time slot</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReschedule} className="space-y-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Slot</Label>
              <Select value={slotTime} onValueChange={setSlotTime}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {slots.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Saving..." : "Reschedule"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          {selected && (() => {
            const user = selected.userId as { name?: string; email?: string; phone?: string } | null;
            const doctor = selected.doctorId as { name?: string; specialization?: string } | null;
            const patient = selected.patientDetails as {
              name?: string;
              gender?: string;
              dateOfBirth?: string | Date;
              height?: number;
              weight?: number;
              diseaseName?: string;
            } | null;
            const status = String(selected.status);
            const age = formatPatientAge(patient?.dateOfBirth);
            const consultationFee = selected.consultationFee as number | undefined;
            const paymentStatus = selected.paymentStatus as string | undefined;

            return (
              <>
                <DialogHeader>
                  <DialogTitle>Appointment Details</DialogTitle>
                  <DialogDescription>
                    {format(new Date(String(selected.appointmentDate)), "EEEE, MMMM d, yyyy")} at {String(selected.slotTime)}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-1">
                  <InfoRow
                    label="Status"
                    value={<Badge variant={statusVariant[status] ?? "outline"}>{status}</Badge>}
                  />
                  <InfoRow label="Doctor" value={doctor?.name || "—"} />
                  {doctor?.specialization && (
                    <InfoRow label="Specialization" value={doctor.specialization} />
                  )}
                  <InfoRow
                    label="Date"
                    value={format(new Date(String(selected.appointmentDate)), "MMM d, yyyy")}
                  />
                  <InfoRow label="Time" value={String(selected.slotTime)} />
                  {selected.notes && <InfoRow label="Notes" value={String(selected.notes)} />}
                </div>

                <Separator />

                <div>
                  <p className="mb-1 text-sm font-semibold">Patient</p>
                  <InfoRow label="Name" value={patient?.name || user?.name || "—"} />
                  {patient?.gender && <InfoRow label="Gender" value={patient.gender} />}
                  {patient?.dateOfBirth && (
                    <InfoRow
                      label="Date of Birth"
                      value={
                        <>
                          {format(new Date(String(patient.dateOfBirth)), "MMM d, yyyy")}
                          {age != null && (
                            <span className="ml-1 text-muted-foreground">({age} yrs)</span>
                          )}
                        </>
                      }
                    />
                  )}
                  {patient?.height != null && (
                    <InfoRow label="Height" value={`${patient.height} cm`} />
                  )}
                  {patient?.weight != null && (
                    <InfoRow label="Weight" value={`${patient.weight} kg`} />
                  )}
                  {patient?.diseaseName && (
                    <InfoRow label="Condition" value={patient.diseaseName} />
                  )}
                  {user?.email && <InfoRow label="Account Email" value={user.email} />}
                  {user?.phone && <InfoRow label="Account Phone" value={user.phone} />}
                </div>

                {(consultationFee != null && consultationFee > 0) || selected.paymentMethod ? (
                  <>
                    <Separator />
                    <div>
                      <p className="mb-1 text-sm font-semibold">Payment</p>
                      {consultationFee != null && consultationFee > 0 && (
                        <InfoRow label="Consultation Fee" value={`₹${consultationFee}`} />
                      )}
                      {selected.paymentMethod && (
                        <InfoRow
                          label="Payment Method"
                          value={paymentMethodLabel(String(selected.paymentMethod))}
                        />
                      )}
                      {paymentStatus && (
                        <InfoRow
                          label="Payment Status"
                          value={
                            <Badge variant={paymentStatus === "COMPLETED" ? "secondary" : "outline"}>
                              {paymentStatus === "COMPLETED" ? "Paid" : "Pending"}
                            </Badge>
                          }
                        />
                      )}
                      {selected.paymentReceiptId && (
                        <InfoRow label="Receipt ID" value={String(selected.paymentReceiptId)} />
                      )}
                      {selected.upiTransactionId && (
                        <InfoRow label="Transaction ID" value={String(selected.upiTransactionId)} />
                      )}
                      {selected.paidAt && (
                        <InfoRow
                          label="Paid At"
                          value={format(new Date(String(selected.paidAt)), "MMM d, yyyy h:mm a")}
                        />
                      )}
                    </div>
                  </>
                ) : null}

                {status === "BOOKED" && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      className="flex-1"
                      variant="outline"
                      onClick={() => {
                        setDetailsOpen(false);
                        openReschedule(selected);
                      }}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reschedule
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => {
                        updateStatus(String(selected._id), "COMPLETED");
                        setDetailsOpen(false);
                      }}
                    >
                      Complete
                    </Button>
                  </div>
                )}
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => handleDelete(String(selected._id))}
                  disabled={deleting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Appointment
                </Button>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}
