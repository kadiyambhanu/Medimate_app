"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Pill, CheckCircle2, Sun, Sunset, Moon, Coffee, Clock, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ExtractedMedicine } from "@/validations/extracted-medicine";
import type { DailyRoutine } from "@/lib/daily-routine";
import {
  FOOD_INSTRUCTION_LABELS,
  FOOD_INSTRUCTION_VALUES,
  type FoodInstruction,
} from "@/lib/food-instructions";
import { applyFrequencyPattern, formatFrequencyPattern } from "@/lib/frequency-pattern";
import { enrichMedicineWithSchedule } from "@/services/reminder-schedule.service";

interface PrescriptionReviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  fileName: string;
  prescriptionId: string;
  medicines: ExtractedMedicine[];
  dailyRoutine: DailyRoutine;
  extractedText?: string;
  onConfirm: (medicines: ExtractedMedicine[], routine: DailyRoutine) => Promise<void>;
  confirming?: boolean;
}

function formatTimeLabel(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes.toString().padStart(2, "0")} ${period}`;
}

export function PrescriptionReview({
  open,
  onOpenChange,
  imageUrl,
  fileName,
  medicines: initialMedicines,
  dailyRoutine,
  extractedText,
  onConfirm,
  confirming,
}: PrescriptionReviewProps) {
  const [medicines, setMedicines] = useState<ExtractedMedicine[]>(initialMedicines);
  const [routine, setRoutine] = useState<DailyRoutine>(dailyRoutine);
  const [success, setSuccess] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(initialMedicines.map((_, i) => i))
  );

  useEffect(() => {
    if (open) {
      setMedicines(initialMedicines);
      setRoutine(dailyRoutine);
      setSelected(new Set(initialMedicines.map((_, i) => i)));
      setSuccess(false);
    }
  }, [open, initialMedicines, dailyRoutine]);

  const scheduledMedicines = useMemo(
    () => medicines.map((medicine) => enrichMedicineWithSchedule(medicine, routine)),
    [medicines, routine]
  );

  const toggleSelected = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const updateMedicine = (index: number, updates: Partial<ExtractedMedicine>) => {
    setMedicines((prev) =>
      prev.map((med, i) => {
        if (i !== index) return med;
        const next = { ...med, ...updates, reminderTimes: undefined };
        return updates.frequency !== undefined ? applyFrequencyPattern(next) : next;
      })
    );
  };

  const updateReminderTime = (index: number, timeIndex: number, value: string) => {
    setMedicines((prev) =>
      prev.map((med, i) => {
        if (i !== index) return med;
        const current = enrichMedicineWithSchedule(med, routine).reminderTimes ?? [];
        const nextTimes = [...current];
        nextTimes[timeIndex] = value;
        return { ...med, reminderTimes: nextTimes };
      })
    );
  };

  const addReminderTime = (index: number) => {
    setMedicines((prev) =>
      prev.map((med, i) => {
        if (i !== index) return med;
        const current = enrichMedicineWithSchedule(med, routine).reminderTimes ?? [];
        return { ...med, reminderTimes: [...current, "08:00"] };
      })
    );
  };

  const removeReminderTime = (index: number, timeIndex: number) => {
    setMedicines((prev) =>
      prev.map((med, i) => {
        if (i !== index) return med;
        const current = enrichMedicineWithSchedule(med, routine).reminderTimes ?? [];
        return { ...med, reminderTimes: current.filter((_, idx) => idx !== timeIndex) };
      })
    );
  };

  const handleConfirm = async () => {
    const toCreate = scheduledMedicines
      .filter((_, i) => selected.has(i))
      .map((medicine) => ({
        ...medicine,
        reminderTimes: medicine.reminderTimes?.length ? medicine.reminderTimes : [],
      }));

    if (toCreate.length === 0) return;
    await onConfirm(toCreate, routine);
    setSuccess(true);
  };

  const handleClose = (value: boolean) => {
    if (!confirming) {
      onOpenChange(value);
      if (!value) setSuccess(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        {success ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-6 w-6" />
                Prescription Applied Successfully
              </DialogTitle>
              <DialogDescription>
                Your medicines and reminders have been saved based on your routine.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="rounded-full bg-green-100 p-4 dark:bg-green-900/30">
                <Pill className="h-10 w-10 text-green-600" />
              </div>
              <p className="text-center text-muted-foreground">
                {selected.size} medicine(s) added with personalized reminder times.
              </p>
              <Button onClick={() => handleClose(false)}>Done</Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Review Medicines & Reminder Times</DialogTitle>
              <DialogDescription>
                Verify extracted details from <strong>{fileName}</strong> before saving. Reminder
                times follow the doctor&apos;s instructions and your daily routine.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-lg border bg-muted/40 p-3 text-sm">
              <p className="font-medium">Your routine</p>
              <p className="text-muted-foreground">
                Wake {formatTimeLabel(routine.wakeUp)} · Breakfast {formatTimeLabel(routine.breakfast)} ·
                Lunch {formatTimeLabel(routine.lunch)} · Dinner {formatTimeLabel(routine.dinner)} ·
                Sleep {formatTimeLabel(routine.sleep)}
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <Label>Prescription Image</Label>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt={fileName}
                  className="max-h-64 w-full rounded-lg border object-contain"
                />
                {extractedText && (
                  <details className="rounded-lg bg-muted p-3">
                    <summary className="cursor-pointer text-sm font-medium">Raw OCR Text</summary>
                    <p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">
                      {extractedText}
                    </p>
                  </details>
                )}
              </div>

              <div className="space-y-3">
                <Label>{medicines.length} Medicine(s) Found</Label>
                {scheduledMedicines.map((med, index) => (
                  <Card key={index} className={selected.has(index) ? "border-primary/50" : "opacity-60"}>
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selected.has(index)}
                          onCheckedChange={() => toggleSelected(index)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-3">
                          <Input
                            value={med.medicineName}
                            onChange={(e) =>
                              updateMedicine(index, { medicineName: e.target.value })
                            }
                            className="font-medium"
                          />

                          <div className="grid gap-2 sm:grid-cols-2">
                            <Input
                              value={med.dosage || ""}
                              placeholder="Dosage (e.g. 650mg)"
                              onChange={(e) => updateMedicine(index, { dosage: e.target.value })}
                            />
                            <Input
                              value={med.frequency || ""}
                              placeholder="Frequency (e.g. 1-0-1)"
                              onChange={(e) => updateMedicine(index, { frequency: e.target.value })}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Pattern: {formatFrequencyPattern(med)} — Morning · Afternoon · Night
                          </p>

                          <Input
                            value={med.duration || ""}
                            placeholder="Duration (e.g. 5 days)"
                            onChange={(e) => updateMedicine(index, { duration: e.target.value })}
                          />

                          <div className="space-y-1.5">
                            <Label className="text-xs">Food Instruction</Label>
                            <Select
                              value={med.foodInstruction || "after_food"}
                              onValueChange={(value: FoodInstruction) =>
                                updateMedicine(index, {
                                  foodInstruction: value,
                                  foodInstructionRaw: FOOD_INSTRUCTION_LABELS[value],
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {FOOD_INSTRUCTION_VALUES.map((value) => (
                                  <SelectItem key={value} value={value}>
                                    {FOOD_INSTRUCTION_LABELS[value]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {med.foodInstructionRaw && (
                              <p className="text-xs text-muted-foreground">
                                Prescription: &quot;{med.foodInstructionRaw}&quot;
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {med.morning && (
                              <Badge variant="secondary" className="gap-1">
                                <Sun className="h-3 w-3" /> Morning
                              </Badge>
                            )}
                            {med.afternoon && (
                              <Badge variant="secondary" className="gap-1">
                                <Coffee className="h-3 w-3" /> Afternoon
                              </Badge>
                            )}
                            {med.evening && (
                              <Badge variant="secondary" className="gap-1">
                                <Sunset className="h-3 w-3" /> Evening
                              </Badge>
                            )}
                            {med.night && (
                              <Badge variant="secondary" className="gap-1">
                                <Moon className="h-3 w-3" /> Night
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-3">
                            {([
                              ["morning", "Morning"],
                              ["afternoon", "Afternoon"],
                              ["night", "Night"],
                            ] as const).map(([slot, label]) => (
                              <label key={slot} className="flex items-center gap-1.5 text-xs">
                                <Checkbox
                                  checked={med[slot]}
                                  onCheckedChange={(checked) =>
                                    updateMedicine(index, { [slot]: !!checked })
                                  }
                                />
                                <span>{label}</span>
                              </label>
                            ))}
                          </div>

                          <div className="space-y-2 rounded-lg border p-3">
                            <div className="flex items-center justify-between">
                              <Label className="flex items-center gap-1.5 text-xs">
                                <Clock className="h-3.5 w-3.5" />
                                Reminder Times
                              </Label>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2"
                                onClick={() => addReminderTime(index)}
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                            {(med.reminderTimes ?? []).map((time, timeIndex) => (
                              <div key={timeIndex} className="flex items-center gap-2">
                                <Input
                                  type="time"
                                  value={time}
                                  onChange={(e) =>
                                    updateReminderTime(index, timeIndex, e.target.value)
                                  }
                                  className="flex-1"
                                />
                                <span className="w-24 text-xs text-muted-foreground">
                                  {formatTimeLabel(time)}
                                </span>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 shrink-0"
                                  onClick={() => removeReminderTime(index, timeIndex)}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => handleClose(false)} disabled={confirming}>
                Cancel
              </Button>
              <Button onClick={handleConfirm} disabled={confirming || selected.size === 0}>
                {confirming && <Loader2 className="animate-spin" />}
                Confirm &amp; Save {selected.size} Medicine(s)
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
