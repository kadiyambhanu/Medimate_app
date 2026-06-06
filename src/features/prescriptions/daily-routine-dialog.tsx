"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DailyRoutine } from "@/lib/daily-routine";
import { DEFAULT_DAILY_ROUTINE } from "@/lib/daily-routine";

interface DailyRoutineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialRoutine?: DailyRoutine;
  onSave: (routine: DailyRoutine) => Promise<void>;
  saving?: boolean;
}

const ROUTINE_FIELDS: { key: keyof DailyRoutine; label: string; hint: string }[] = [
  { key: "wakeUp", label: "Wake-up Time", hint: "Used for empty stomach medicines" },
  { key: "breakfast", label: "Breakfast Time", hint: "Before/after breakfast doses" },
  { key: "lunch", label: "Lunch Time", hint: "Before/after lunch doses" },
  { key: "dinner", label: "Dinner Time", hint: "Before/after dinner doses" },
  { key: "sleep", label: "Sleep Time", hint: "Before sleep doses" },
];

export function DailyRoutineDialog({
  open,
  onOpenChange,
  initialRoutine,
  onSave,
  saving,
}: DailyRoutineDialogProps) {
  const [routine, setRoutine] = useState<DailyRoutine>(DEFAULT_DAILY_ROUTINE);

  useEffect(() => {
    if (open) {
      setRoutine(initialRoutine ?? DEFAULT_DAILY_ROUTINE);
    }
  }, [open, initialRoutine]);

  const updateField = (key: keyof DailyRoutine, value: string) => {
    setRoutine((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    await onSave(routine);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Your Daily Routine</DialogTitle>
          <DialogDescription>
            Reminder times are generated from your routine and the doctor&apos;s food instructions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {ROUTINE_FIELDS.map(({ key, label, hint }) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={key}>{label}</Label>
              <Input
                id={key}
                type="time"
                value={routine[key]}
                onChange={(e) => updateField(key, e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{hint}</p>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
            {saving && <Loader2 className="animate-spin" />}
            Continue to Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
