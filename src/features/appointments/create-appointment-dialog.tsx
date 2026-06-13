"use client";

import { useCallback, useEffect, useState } from "react";
import { format, addDays, differenceInYears } from "date-fns";
import {
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Loader2,
  Stethoscope,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PaymentMethodSelect } from "@/components/shared/payment-method-select";
import { PaymentReceiptDialog } from "@/components/shared/payment-receipt-dialog";
import { UpiPaymentPanel } from "@/components/shared/upi-payment-panel";
import {
  emptyPatientDetails,
  isPatientDetailsValid,
  PatientDetailsForm,
} from "@/components/shared/patient-details-form";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { APPOINTMENT_FEE } from "@/lib/constants";
import api from "@/lib/api";
import type { IDoctor, IHospital, PaymentMethod, PaymentReceiptData } from "@/types";
import { buildPaymentReceiptFromAppointment } from "@/utils/payment-receipt";
import type { PatientDetailsInput } from "@/validations/appointment";
import type { PatientDetailsFormInput } from "@/components/shared/patient-details-form";

const STEPS = [
  { id: 1, label: "Patient", icon: User },
  { id: 2, label: "Doctor", icon: Stethoscope },
  { id: 3, label: "Schedule", icon: Calendar },
  { id: 4, label: "Payment", icon: CreditCard },
] as const;

interface CreateAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateAppointmentDialog({ open, onOpenChange, onSuccess }: CreateAppointmentDialogProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);

  const [hospitals, setHospitals] = useState<IHospital[]>([]);
  const [doctors, setDoctors] = useState<IDoctor[]>([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(false);
  const [doctorsLoading, setDoctorsLoading] = useState(false);

  const [hospitalId, setHospitalId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState(format(addDays(new Date(), 1), "yyyy-MM-dd"));
  const [slot, setSlot] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [patientDetails, setPatientDetails] = useState<PatientDetailsFormInput>(emptyPatientDetails());
  const [creating, setCreating] = useState(false);
  const [upiPayStarted, setUpiPayStarted] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receipt, setReceipt] = useState<PaymentReceiptData | null>(null);

  const resetForm = useCallback(() => {
    setStep(1);
    setHospitalId("");
    setDoctorId("");
    setDoctors([]);
    setDate(format(addDays(new Date(), 1), "yyyy-MM-dd"));
    setSlot("");
    setSlots([]);
    setNotes("");
    setPaymentMethod("");
    setUpiPayStarted(false);
    setPaymentConfirmed(false);
    setPatientDetails(emptyPatientDetails());
    setReceipt(null);
    setReceiptOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    resetForm();
    if (user?.name) {
      setPatientDetails((prev) => ({ ...prev, name: user.name ?? "" }));
    }
    setHospitalsLoading(true);
    api
      .get("/hospitals")
      .then((res) => setHospitals(res.data.data))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load hospitals"))
      .finally(() => setHospitalsLoading(false));
  }, [open, resetForm, user?.name]);

  useEffect(() => {
    if (!hospitalId) {
      setDoctors([]);
      setDoctorId("");
      return;
    }
    setDoctorsLoading(true);
    setDoctorId("");
    setSlot("");
    setSlots([]);
    api
      .get(`/doctors?hospitalId=${hospitalId}`)
      .then((res) => setDoctors(res.data.data))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load doctors"))
      .finally(() => setDoctorsLoading(false));
  }, [hospitalId]);

  useEffect(() => {
    if (!doctorId || !date) return;
    setSlotsLoading(true);
    api
      .get(`/doctors/${doctorId}/slots?date=${date}`)
      .then((res) => {
        setSlots(res.data.data);
        setSlot("");
      })
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [doctorId, date]);

  useEffect(() => {
    setUpiPayStarted(false);
    setPaymentConfirmed(false);
  }, [paymentMethod]);

  const selectedHospital = hospitals.find((h) => h._id.toString() === hospitalId);
  const selectedDoctor = doctors.find((d) => d._id.toString() === doctorId);
  const appointmentFee = APPOINTMENT_FEE;

  const canGoToStep2 = isPatientDetailsValid(patientDetails);
  const canGoToStep3 = Boolean(hospitalId && doctorId);
  const canGoToStep4 = Boolean(slot);
  const canSubmitPayAtHospital = paymentMethod === "PAY_AT_HOSPITAL" && !creating;

  const bookAppointment = useCallback(async (upiTransactionId?: string) => {
    if (!hospitalId || !doctorId || !slot || !paymentMethod || !canGoToStep2) return;

    const isUpi = paymentMethod === "UPI";
    if (isUpi && !upiTransactionId) return;

    setCreating(true);
    try {
      const res = await api.post("/appointments", {
        hospitalId,
        doctorId,
        appointmentDate: date,
        slotTime: slot,
        notes: notes || undefined,
        paymentMethod,
        patientDetails,
        ...(isUpi && {
          paymentCompleted: true,
          upiTransactionId,
        }),
      });

      const appointment = res.data.data as Record<string, unknown>;
      const receiptData = buildPaymentReceiptFromAppointment(appointment);

      if (receiptData) {
        setReceipt(receiptData);
        setReceiptOpen(true);
        toast.success("Payment confirmed. Appointment confirmed!");
      } else {
        toast.success("Appointment confirmed!");
      }

      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setPaymentConfirmed(false);
      toast.error(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setCreating(false);
    }
  }, [
    hospitalId,
    doctorId,
    slot,
    paymentMethod,
    canGoToStep2,
    date,
    notes,
    patientDetails,
    onOpenChange,
    onSuccess,
  ]);

  const handleUpiPaymentComplete = useCallback((transactionId: string) => {
    setPaymentConfirmed(true);
    bookAppointment(transactionId);
  }, [bookAppointment]);

  const goNext = () => {
    if (step === 1 && !canGoToStep2) {
      toast.error("Fill in all patient details");
      return;
    }
    if (step === 2 && !canGoToStep3) {
      toast.error("Select a hospital and doctor");
      return;
    }
    if (step === 3 && !canGoToStep4) {
      toast.error("Select a time slot");
      return;
    }
    setStep((s) => Math.min(s + 1, 4));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 1));

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <div className="border-b bg-muted/30 px-6 py-5">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl">Book Appointment</DialogTitle>
            <DialogDescription>
              Enter patient details, choose a doctor, schedule, and pay.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 flex items-center gap-2">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const active = step === s.id;
              const done = step > s.id;

              return (
                <div key={s.id} className="flex flex-1 items-center gap-2">
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors",
                      active && "bg-primary text-primary-foreground",
                      done && "bg-primary/20 text-primary",
                      !active && !done && "bg-muted text-muted-foreground"
                    )}
                  >
                    {done ? "✓" : <Icon className="h-3.5 w-3.5" />}
                  </div>
                  <span
                    className={cn(
                      "hidden text-xs font-medium sm:inline",
                      active ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {s.label}
                  </span>
                  {i < STEPS.length - 1 && (
                    <div className={cn("mx-1 h-px flex-1", done ? "bg-primary/40" : "bg-border")} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">Patient Information</h3>
                <p className="text-xs text-muted-foreground">
                  Medical details help the doctor prepare for your visit.
                </p>
              </div>
              <PatientDetailsForm value={patientDetails} onChange={setPatientDetails} />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Hospital
                </Label>
                <Select value={hospitalId} onValueChange={setHospitalId} disabled={hospitalsLoading}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder={hospitalsLoading ? "Loading hospitals..." : "Choose a hospital"} />
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

              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-muted-foreground" />
                  Doctor
                </Label>

                {!hospitalId ? (
                  <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                    Select a hospital to see available doctors
                  </p>
                ) : doctorsLoading ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading doctors...
                  </div>
                ) : doctors.length === 0 ? (
                  <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                    No doctors available at this hospital
                  </p>
                ) : (
                  <div className="grid gap-2">
                    {doctors.map((doctor) => {
                      const selected = doctorId === doctor._id.toString();
                      return (
                        <button
                          key={doctor._id.toString()}
                          type="button"
                          onClick={() => setDoctorId(doctor._id.toString())}
                          className={cn(
                            "flex items-center gap-3 rounded-xl border p-3 text-left transition-all",
                            selected
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "hover:border-primary/40 hover:bg-accent/50"
                          )}
                        >
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <Stethoscope className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium">{doctor.name}</p>
                            <p className="text-xs text-muted-foreground">{doctor.specialization}</p>
                          </div>
                          <span className="shrink-0 text-sm font-medium text-primary">
                            ₹{appointmentFee}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              {selectedDoctor && selectedHospital && (
                <div className="rounded-xl border bg-muted/20 p-4">
                  <p className="font-medium">{selectedDoctor.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedHospital.hospitalName} · {selectedDoctor.specialization}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Appointment Date</Label>
                <Input
                  type="date"
                  className="h-11"
                  value={date}
                  min={format(new Date(), "yyyy-MM-dd")}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-3">
                <Label>Available Time Slots</Label>
                {slotsLoading ? (
                  <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Finding available slots...
                  </div>
                ) : slots.length === 0 ? (
                  <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                    No slots available for this date. Try another day.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {slots.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setSlot(time)}
                        className={cn(
                          "rounded-lg border px-2 py-2.5 text-sm font-medium transition-colors",
                          slot === time
                            ? "border-primary bg-primary text-primary-foreground"
                            : "hover:border-primary/40 hover:bg-accent"
                        )}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Notes for doctor (optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Symptoms, allergies, or reason for visit..."
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          )}

          {step === 4 && selectedDoctor && (
            <div className="space-y-5">
              <div className="overflow-hidden rounded-xl border">
                <div className="bg-primary/5 px-4 py-3">
                  <p className="text-sm font-medium">Appointment Summary</p>
                </div>
                <div className="space-y-2.5 p-4 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Patient</span>
                    <span className="text-right font-medium">{patientDetails.name}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Gender</span>
                    <span className="text-right font-medium">{patientDetails.gender}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">DOB</span>
                    <span className="text-right font-medium">
                      {format(new Date(patientDetails.dateOfBirth), "MMM d, yyyy")}
                      {patientDetails.dateOfBirth && (
                        <span className="text-muted-foreground">
                          {" "}
                          ({differenceInYears(new Date(), new Date(patientDetails.dateOfBirth))} yrs)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Height / Weight</span>
                    <span className="text-right font-medium">
                      {patientDetails.height} cm · {patientDetails.weight} kg
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Condition</span>
                    <span className="text-right font-medium">{patientDetails.diseaseName}</span>
                  </div>
                  <div className="border-t pt-2.5" />
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Doctor</span>
                    <span className="text-right font-medium">{selectedDoctor.name}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Hospital</span>
                    <span className="text-right font-medium">{selectedHospital?.hospitalName}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Date</span>
                    <span className="text-right font-medium">
                      {format(new Date(date), "EEE, MMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Time</span>
                    <span className="text-right font-medium">{slot}</span>
                  </div>
                  <div className="border-t pt-2.5">
                    <div className="flex justify-between gap-4">
                      <span className="font-medium">Appointment Fee</span>
                      <span className="text-lg font-semibold text-primary">₹{appointmentFee}</span>
                    </div>
                  </div>
                </div>
              </div>

              <PaymentMethodSelect
                value={paymentMethod}
                onChange={setPaymentMethod}
                compact
                disabled={paymentConfirmed || creating}
              />

              {paymentMethod === "UPI" && !upiPayStarted && !paymentConfirmed && (
                <Button type="button" className="w-full" onClick={() => setUpiPayStarted(true)}>
                  Pay ₹{appointmentFee} with UPI
                </Button>
              )}

              {paymentMethod === "UPI" && upiPayStarted && !paymentConfirmed && (
                <UpiPaymentPanel
                  amount={appointmentFee}
                  onPaymentComplete={handleUpiPaymentComplete}
                />
              )}

              {paymentMethod === "UPI" && paymentConfirmed && creating && (
                <div className="flex items-center justify-center gap-2 rounded-xl border bg-primary/5 px-4 py-6 text-sm font-medium text-primary">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Payment confirmed — confirming your appointment...
                </div>
              )}

            </div>
          )}
        </div>

        <DialogFooter className="border-t bg-muted/20 px-6 py-4 sm:justify-between">
          {step > 1 ? (
            <Button type="button" variant="outline" onClick={goBack} disabled={creating}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <Button
              type="button"
              onClick={goNext}
              disabled={
                step === 1 ? !canGoToStep2 : step === 2 ? !canGoToStep3 : !canGoToStep4
              }
            >
              Continue
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : paymentMethod === "PAY_AT_HOSPITAL" ? (
            <Button
              type="button"
              onClick={() => bookAppointment()}
              disabled={!canSubmitPayAtHospital}
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Booking...
                </>
              ) : (
                "Confirm Appointment"
              )}
            </Button>
          ) : paymentMethod === "UPI" ? (
            <p className="text-sm text-muted-foreground">
              {paymentConfirmed && creating
                ? "Confirming appointment..."
                : upiPayStarted
                  ? "Complete UPI payment to confirm appointment"
                  : "Start UPI payment to confirm appointment"}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Select a payment method</p>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>

      <PaymentReceiptDialog
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        receipt={receipt}
      />
    </>
  );
}
