import { jsPDF } from "jspdf";
import type { PaymentReceiptData } from "@/types";

export function generatePaymentReceiptPDF(receipt: PaymentReceiptData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 36, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text("Payment Receipt", 14, 18);
  doc.setFontSize(10);
  doc.text("MediMate — Appointment Consultation", 14, 28);

  doc.setTextColor(30, 30, 30);
  let y = 50;

  const row = (label: string, value: string) => {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(label, 14, y);
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.text(value, pageWidth - 14, y, { align: "right" });
    doc.setFont("helvetica", "normal");
    y += 10;
  };

  row("Receipt No.", receipt.receiptId);
  row("Transaction ID", receipt.transactionId);
  row("Patient", receipt.patientName);
  row("Doctor", receipt.doctorName);
  row("Hospital", receipt.hospitalName);
  row("Appointment", `${receipt.appointmentDate} at ${receipt.slotTime}`);
  row("Payment Method", receipt.paymentMethod);
  row("Paid On", new Date(receipt.paidAt).toLocaleString());

  y += 4;
  doc.setDrawColor(220, 220, 220);
  doc.line(14, y, pageWidth - 14, y);
  y += 12;

  doc.setFontSize(12);
  doc.setTextColor(30, 30, 30);
  doc.text("Amount Paid", 14, y);
  doc.setFontSize(16);
  doc.setTextColor(37, 99, 235);
  doc.text(`₹${receipt.amount}`, pageWidth - 14, y, { align: "right" });

  y += 20;
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text("This is a computer-generated receipt. No signature required.", 14, y);
  doc.text("Thank you for using MediMate.", 14, y + 6);

  return doc;
}

export function downloadPaymentReceipt(receipt: PaymentReceiptData) {
  const doc = generatePaymentReceiptPDF(receipt);
  doc.save(`receipt-${receipt.receiptId}.pdf`);
}
