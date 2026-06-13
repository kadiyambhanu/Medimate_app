import { format } from "date-fns";
import type { PaymentReceiptData } from "@/types";

export function buildPaymentReceiptFromAppointment(
  appointment: Record<string, unknown>
): PaymentReceiptData | null {
  if (appointment.paymentStatus !== "COMPLETED" || !appointment.paymentReceiptId) {
    return null;
  }

  const doctor = appointment.doctorId as { name?: string } | null;
  const hospital = appointment.hospitalId as { hospitalName?: string } | null;
  const patient = appointment.patientDetails as { name?: string } | null;

  return {
    receiptId: String(appointment.paymentReceiptId),
    transactionId: String(appointment.upiTransactionId ?? ""),
    patientName: patient?.name ?? "Patient",
    doctorName: doctor?.name ?? "Doctor",
    hospitalName: hospital?.hospitalName ?? "Hospital",
    appointmentDate: format(new Date(String(appointment.appointmentDate)), "EEE, MMM d, yyyy"),
    slotTime: String(appointment.slotTime),
    amount: Number(appointment.consultationFee ?? 0),
    paymentMethod: "UPI",
    paidAt: String(appointment.paidAt ?? new Date().toISOString()),
  };
}
