import { extractedMedicineSchema, type ExtractedMedicine } from "@/validations/extracted-medicine";
import { generateGeminiContent } from "@/services/gemini.client";
import { normalizeFoodInstruction } from "@/lib/food-instructions";
import { applyFrequencyPattern } from "@/lib/frequency-pattern";

const EXTRACTION_FIELDS = `- medicineName: brand or medicine name (e.g. "Dolo 650", "Pantop 40")
- dosage: strength if available (e.g. "650mg", "40mg") — omit if embedded in name
- frequency: human-readable frequency exactly as written (e.g. "Twice Daily", "1-0-1")
- duration: course length exactly as written (e.g. "5 days", "2 weeks", "1 month")
- foodInstruction: one of before_breakfast, after_breakfast, before_lunch, after_lunch, before_dinner, after_dinner, before_food, after_food, before_sleep, empty_stomach
- foodInstructionRaw: exact food/timing phrase from the prescription (e.g. "After Breakfast", "Empty Stomach")
- morning, afternoon, evening, night: boolean flags from the dosage frequency pattern
- beforeFood, afterFood: legacy booleans only when foodInstruction cannot be determined
- notes: any extra instructions not captured above

IMPORTANT — Indian prescription frequency uses 3 numbers: Morning - Afternoon - Night
- "1-0-1" → morning:true, afternoon:false, night:true, evening:false
- "1-0-0" → morning:true, afternoon:false, night:false, evening:false
- "0-0-1" → morning:false, afternoon:false, night:true, evening:false
- "0-1-0" → afternoon:true only
- "1-1-1" → morning, afternoon, and night all true
- The MIDDLE number is AFTERNOON (not evening). Only use evening:true for explicit 4-part patterns like "1-0-1-0"`;

const PARSE_RULES = `Rules:
- Preserve doctor instructions exactly in foodInstructionRaw
- Map food phrases precisely:
  "Before Breakfast"/"BB" → foodInstruction: "before_breakfast"
  "After Breakfast"/"AB" → foodInstruction: "after_breakfast"
  "Before Lunch" → foodInstruction: "before_lunch"
  "After Lunch" → foodInstruction: "after_lunch"
  "Before Dinner"/"Before Supper" → foodInstruction: "before_dinner"
  "After Dinner"/"After Supper" → foodInstruction: "after_dinner"
  "Before Food"/"Before Meals"/"BF" → foodInstruction: "before_food"
  "After Food"/"After Meals"/"AF" → foodInstruction: "after_food"
  "Before Sleep"/"At Bedtime"/"HS" → foodInstruction: "before_sleep"
  "Empty Stomach"/"Fasting" → foodInstruction: "empty_stomach"
- Frequency pattern is always Morning - Afternoon - Night (3 numbers)
- "1-0-1" → morning:true, afternoon:false, night:true (NOT evening)
- "1-0-0" → morning:true only
- "0-0-1" → night:true only
- "after meals" → foodInstruction: "after_food", foodInstructionRaw: "After Meals"
- "before meals" → foodInstruction: "before_food", foodInstructionRaw: "Before Meals"
- Return ONLY a valid JSON array`;

const IMAGE_PARSE_PROMPT = `You are a medical prescription parser. Extract all medicines from this doctor's prescription image.

For each medicine, extract:
${EXTRACTION_FIELDS}

${PARSE_RULES}`;

const PARSE_PROMPT = `You are a medical prescription parser. Extract all medicines from the OCR text of a doctor's prescription.

For each medicine, extract:
${EXTRACTION_FIELDS}

${PARSE_RULES}

OCR Text:
`;

function parseJsonArray(raw: string): unknown[] {
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) {
    throw new Error("Gemini response is not a JSON array");
  }
  return parsed;
}

function normalizeMedicine(raw: Record<string, unknown>): ExtractedMedicine {
  const foodInstruction =
    normalizeFoodInstruction(String(raw.foodInstruction ?? "")) ??
    normalizeFoodInstruction(String(raw.foodInstructionRaw ?? ""));

  return applyFrequencyPattern(
    extractedMedicineSchema.parse({
      medicineName: raw.medicineName,
      dosage: raw.dosage ?? undefined,
      frequency: raw.frequency ?? undefined,
      duration: raw.duration ?? undefined,
      foodInstruction,
      foodInstructionRaw: raw.foodInstructionRaw ?? undefined,
      morning: Boolean(raw.morning),
      afternoon: Boolean(raw.afternoon),
      evening: Boolean(raw.evening),
      night: Boolean(raw.night),
      beforeFood: Boolean(raw.beforeFood),
      afterFood: Boolean(raw.afterFood),
      notes: raw.notes ?? undefined,
    })
  );
}

function medicinesFromGeminiResponse(raw: string): ExtractedMedicine[] {
  const items = parseJsonArray(raw);
  const medicines = items
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map(normalizeMedicine)
    .filter((m) => m.medicineName.trim().length > 0);

  if (medicines.length === 0) {
    throw new Error("No medicines could be extracted from the prescription");
  }

  return medicines;
}

export async function parseMedicinesFromImage(
  buffer: Buffer,
  mimeType: string
): Promise<ExtractedMedicine[]> {
  const raw = await generateGeminiContent(
    [
      { inlineData: { data: buffer.toString("base64"), mimeType } },
      IMAGE_PARSE_PROMPT,
    ],
    { jsonMode: true }
  );

  return medicinesFromGeminiResponse(raw);
}

export async function parseMedicinesFromText(ocrText: string): Promise<ExtractedMedicine[]> {
  if (!ocrText.trim()) {
    throw new Error("No text to parse");
  }

  const raw = await generateGeminiContent(PARSE_PROMPT + ocrText, { jsonMode: true });
  return medicinesFromGeminiResponse(raw);
}
