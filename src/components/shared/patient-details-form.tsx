"use client";

import { differenceInYears } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { PatientDetailsInput } from "@/validations/appointment";

export type PatientDetailsFormInput = Omit<PatientDetailsInput, "gender"> & {
  gender: PatientDetailsInput["gender"] | "";
};

interface PatientDetailsFormProps {
  value: PatientDetailsFormInput;
  onChange: (value: PatientDetailsFormInput) => void;
}

function calculateAge(dateOfBirth: string): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const age = differenceInYears(new Date(), dob);
  return age >= 0 ? age : null;
}

export function PatientDetailsForm({ value, onChange }: PatientDetailsFormProps) {
  const update = (field: keyof PatientDetailsFormInput, fieldValue: string | number) => {
    onChange({ ...value, [field]: fieldValue });
  };

  const age = calculateAge(value.dateOfBirth);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="patientName">Full Name</Label>
        <Input
          id="patientName"
          value={value.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="Patient full name"
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <Label>Gender</Label>
        <Select
          value={value.gender || undefined}
          onValueChange={(v) => update("gender", v)}
        >
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Select gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Male">Male</SelectItem>
            <SelectItem value="Female">Female</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="patientDob">Date of Birth</Label>
        <div className="flex items-center gap-3">
          <Input
            id="patientDob"
            type="date"
            value={value.dateOfBirth}
            max={new Date().toISOString().split("T")[0]}
            onChange={(e) => update("dateOfBirth", e.target.value)}
            className="h-11 flex-1"
          />
          <div
            className={cn(
              "flex h-11 shrink-0 items-center justify-center rounded-md border px-3 text-sm font-medium",
              age != null ? "border-primary/30 bg-primary/5 text-primary" : "bg-muted/50 text-muted-foreground"
            )}
            aria-live="polite"
          >
            {age != null ? `${age} yrs` : "Age"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="patientHeight">Height (cm)</Label>
          <Input
            id="patientHeight"
            type="number"
            min={1}
            max={300}
            value={value.height || ""}
            onChange={(e) => update("height", Number(e.target.value) || 0)}
            placeholder="e.g. 170"
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="patientWeight">Weight (kg)</Label>
          <Input
            id="patientWeight"
            type="number"
            min={1}
            max={500}
            value={value.weight || ""}
            onChange={(e) => update("weight", Number(e.target.value) || 0)}
            placeholder="e.g. 65"
            className="h-11"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="diseaseName">Disease / Condition</Label>
        <Input
          id="diseaseName"
          value={value.diseaseName}
          onChange={(e) => update("diseaseName", e.target.value)}
          placeholder="e.g. Diabetes, Fever, Hypertension"
          className="h-11"
        />
      </div>
    </div>
  );
}

export const emptyPatientDetails = (): PatientDetailsFormInput => ({
  name: "",
  gender: "",
  dateOfBirth: "",
  height: 0,
  weight: 0,
  diseaseName: "",
});

const GENDERS = ["Male", "Female", "Other"] as const;

export function isPatientDetailsValid(details: PatientDetailsFormInput): boolean {
  return (
    details.name.trim().length > 0 &&
    GENDERS.includes(details.gender as (typeof GENDERS)[number]) &&
    details.dateOfBirth.length > 0 &&
    details.height > 0 &&
    details.weight > 0 &&
    details.diseaseName.trim().length > 0
  );
}
