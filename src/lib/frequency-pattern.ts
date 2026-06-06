import type { ExtractedMedicine } from "@/validations/extracted-medicine";

export interface ParsedFrequencySlots {
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
  night: boolean;
}

const FREQUENCY_PATTERN =
  /(\d)\s*[-–—/]\s*(\d)\s*[-–—/]\s*(\d)(?:\s*[-–—/]\s*(\d))?/;

/**
 * Indian prescription notation: Morning - Afternoon - Night
 * e.g. 1-0-1 = 1 morning, 0 afternoon, 1 night
 */
export function parseFrequencyPattern(input?: string | null): ParsedFrequencySlots | null {
  if (!input?.trim()) return null;

  const match = input.trim().match(FREQUENCY_PATTERN);
  if (!match) return null;

  const [, morning, afternoon, third, fourth] = match;

  if (fourth !== undefined) {
    return {
      morning: morning !== "0",
      afternoon: afternoon !== "0",
      evening: third !== "0",
      night: fourth !== "0",
    };
  }

  return {
    morning: morning !== "0",
    afternoon: afternoon !== "0",
    evening: false,
    night: third !== "0",
  };
}

export function formatFrequencyPattern(slots: ParsedFrequencySlots): string {
  const m = slots.morning ? 1 : 0;
  const a = slots.afternoon ? 1 : 0;
  const n = slots.night ? 1 : 0;
  if (slots.evening) {
    const e = 1;
    return `${m}-${a}-${e}-${n}`;
  }
  return `${m}-${a}-${n}`;
}

export function applyFrequencyPattern(medicine: ExtractedMedicine): ExtractedMedicine {
  const parsed =
    parseFrequencyPattern(medicine.frequency) ??
    parseFrequencyPattern(medicine.dosage) ??
    parseFrequencyPattern(medicine.notes);

  if (!parsed) return medicine;

  return {
    ...medicine,
    morning: parsed.morning,
    afternoon: parsed.afternoon,
    evening: parsed.evening,
    night: parsed.night,
  };
}

export const FREQUENCY_PATTERN_HELP =
  "1-0-1 means Morning 1 · Afternoon 0 · Night 1";
