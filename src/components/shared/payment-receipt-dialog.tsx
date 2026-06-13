"use client";

import { Download, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { downloadPaymentReceipt } from "@/utils/payment-receipt-pdf";
import type { PaymentReceiptData } from "@/types";

interface PaymentReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: PaymentReceiptData | null;
}

export function PaymentReceiptDialog({ open, onOpenChange, receipt }: PaymentReceiptDialogProps) {
  if (!receipt) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Appointment Confirmed
          </DialogTitle>
          <DialogDescription>
            Payment received successfully. Your appointment has been confirmed.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-center text-sm font-medium text-green-600 dark:text-green-400">
          Payment of ₹{receipt.amount} confirmed
        </div>

        <div className="space-y-3 rounded-xl border bg-muted/20 p-4 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Receipt No.</span>
            <span className="font-medium">{receipt.receiptId}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Transaction ID</span>
            <span className="font-mono text-xs">{receipt.transactionId}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Patient</span>
            <span className="font-medium">{receipt.patientName}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Doctor</span>
            <span className="font-medium">{receipt.doctorName}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Hospital</span>
            <span className="text-right font-medium">{receipt.hospitalName}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Appointment</span>
            <span className="text-right font-medium">
              {receipt.appointmentDate} · {receipt.slotTime}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Paid On</span>
            <span className="font-medium">
              {format(new Date(receipt.paidAt), "MMM d, yyyy h:mm a")}
            </span>
          </div>
          <div className="border-t pt-3">
            <div className="flex justify-between gap-4">
              <span className="font-medium">Amount Paid</span>
              <span className="text-lg font-semibold text-primary">₹{receipt.amount}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={() => downloadPaymentReceipt(receipt)}>
            <Download className="mr-2 h-4 w-4" />
            Download Receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
