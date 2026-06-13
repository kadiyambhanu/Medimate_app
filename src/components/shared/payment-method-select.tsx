"use client";

import { Building2, Smartphone } from "lucide-react";
import { Label } from "@/components/ui/label";
import { PAYMENT_METHODS } from "@/lib/constants";
import type { PaymentMethod } from "@/types";
import { cn } from "@/lib/utils";

const METHOD_ICONS: Record<PaymentMethod, typeof Smartphone> = {
  UPI: Smartphone,
  PAY_AT_HOSPITAL: Building2,
};

interface PaymentMethodSelectProps {
  value: PaymentMethod | "";
  onChange: (method: PaymentMethod) => void;
  consultationFee?: number;
  disabled?: boolean;
  compact?: boolean;
}

export function PaymentMethodSelect({
  value,
  onChange,
  consultationFee = 0,
  disabled = false,
  compact = false,
}: PaymentMethodSelectProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Payment Method</Label>
        {!compact && consultationFee > 0 && (
          <span className="text-sm font-medium text-primary">₹{consultationFee} appointment fee</span>
        )}
      </div>
      <div className={cn("grid gap-2", compact && "grid-cols-2")}>
        {PAYMENT_METHODS.map((method) => {
          const Icon = METHOD_ICONS[method.value];
          const selected = value === method.value;

          return (
            <button
              key={method.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(method.value)}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                compact && "flex-col items-center gap-2 p-3 text-center",
                selected
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "hover:bg-accent",
                disabled && "cursor-not-allowed opacity-60"
              )}
            >
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
                  compact && "h-8 w-8",
                  selected ? "bg-primary text-primary-foreground" : "bg-muted"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className={cn("min-w-0", compact && "w-full")}>
                <p className="text-sm font-medium">{method.label}</p>
                {!compact && (
                  <p className="text-xs text-muted-foreground">{method.description}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
