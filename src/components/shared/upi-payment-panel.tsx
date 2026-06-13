"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, Smartphone } from "lucide-react";
import { generateUpiTransactionId, getUpiQrImageUrl, UPI_MERCHANT_ID } from "@/lib/upi";
import { cn } from "@/lib/utils";

const UPI_APPS = ["Google Pay", "PhonePe", "Paytm", "BHIM UPI"];

type PaymentPhase = "scan" | "waiting" | "success";

interface UpiPaymentPanelProps {
  amount: number;
  onPaymentComplete: (transactionId: string) => void;
}

const PAYMENT_SIMULATION_MS = 6000;

export function UpiPaymentPanel({ amount, onPaymentComplete }: UpiPaymentPanelProps) {
  const [phase, setPhase] = useState<PaymentPhase>("scan");
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onPaymentComplete);
  onCompleteRef.current = onPaymentComplete;
  const qrUrl = getUpiQrImageUrl(amount);

  useEffect(() => {
    completedRef.current = false;
    setPhase("scan");

    const waitTimer = setTimeout(() => setPhase("waiting"), 1500);
    const successTimer = setTimeout(() => {
      if (completedRef.current) return;
      completedRef.current = true;
      setPhase("success");
      setTimeout(() => {
        onCompleteRef.current(generateUpiTransactionId());
      }, 800);
    }, PAYMENT_SIMULATION_MS);

    return () => {
      clearTimeout(waitTimer);
      clearTimeout(successTimer);
    };
  }, [amount]);

  return (
    <div className="space-y-4 rounded-xl border bg-card p-4">
      <div className="text-center">
        <p className="text-sm font-medium">Pay ₹{amount} via UPI</p>
        <p className="text-xs text-muted-foreground">Scan the QR code with any UPI app</p>
      </div>

      <div className="flex justify-center">
        <div
          className={cn(
            "relative rounded-xl border bg-white p-3 transition-opacity",
            phase === "success" && "opacity-40"
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrUrl} alt="UPI QR Code" width={200} height={200} className="rounded-lg" />
          {phase === "success" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
          )}
        </div>
      </div>

      <div className="text-center text-xs text-muted-foreground">
        Pay to: <span className="font-medium text-foreground">{UPI_MERCHANT_ID}</span>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {UPI_APPS.map((app) => (
          <span
            key={app}
            className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-2.5 py-1 text-xs"
          >
            <Smartphone className="h-3 w-3" />
            {app}
          </span>
        ))}
      </div>

      {phase === "scan" && (
        <p className="text-center text-sm text-muted-foreground">Open your UPI app and scan to pay</p>
      )}

      {phase === "waiting" && (
        <div className="flex items-center justify-center gap-2 text-sm text-primary">
          <Loader2 className="h-4 w-4 animate-spin" />
          Waiting for UPI payment...
        </div>
      )}

      {phase === "success" && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-center">
          <p className="text-sm font-medium text-green-600 dark:text-green-400">
            Payment successful — ₹{amount} received
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Confirming your appointment...</p>
        </div>
      )}
    </div>
  );
}
