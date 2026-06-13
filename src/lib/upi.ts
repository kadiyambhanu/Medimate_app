import { APP_NAME } from "@/lib/constants";

export const UPI_MERCHANT_ID = "medimate@upi";
export const UPI_MERCHANT_NAME = APP_NAME;

export function buildUpiPaymentUri(amount: number, note = "Consultation Fee") {
  const params = new URLSearchParams({
    pa: UPI_MERCHANT_ID,
    pn: UPI_MERCHANT_NAME,
    am: amount.toFixed(2),
    cu: "INR",
    tn: note,
  });
  return `upi://pay?${params.toString()}`;
}

export function getUpiQrImageUrl(amount: number, note = "Consultation Fee") {
  const upiUri = buildUpiPaymentUri(amount, note);
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(upiUri)}`;
}

export function generateUpiTransactionId() {
  return `UPI${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function formatReceiptNumber(sequence: number): string {
  const num = ((Math.max(sequence, 1) - 1) % 99) + 1;
  return String(num).padStart(2, "0");
}
