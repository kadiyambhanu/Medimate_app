export const FOOD_INSTRUCTION_VALUES = [
  "before_breakfast",
  "after_breakfast",
  "before_lunch",
  "after_lunch",
  "before_dinner",
  "after_dinner",
  "before_food",
  "after_food",
  "before_sleep",
  "empty_stomach",
] as const;

export type FoodInstruction = (typeof FOOD_INSTRUCTION_VALUES)[number];

export const FOOD_INSTRUCTION_LABELS: Record<FoodInstruction, string> = {
  before_breakfast: "Before Breakfast",
  after_breakfast: "After Breakfast",
  before_lunch: "Before Lunch",
  after_lunch: "After Lunch",
  before_dinner: "Before Dinner",
  after_dinner: "After Dinner",
  before_food: "Before Food",
  after_food: "After Food",
  before_sleep: "Before Sleep",
  empty_stomach: "Empty Stomach",
};

const NORMALIZE_MAP: Record<string, FoodInstruction> = {
  before_breakfast: "before_breakfast",
  "before breakfast": "before_breakfast",
  bf: "before_breakfast",
  after_breakfast: "after_breakfast",
  "after breakfast": "after_breakfast",
  ab: "after_breakfast",
  before_lunch: "before_lunch",
  "before lunch": "before_lunch",
  after_lunch: "after_lunch",
  "after lunch": "after_lunch",
  before_dinner: "before_dinner",
  "before dinner": "before_dinner",
  before_supper: "before_dinner",
  "before supper": "before_dinner",
  after_dinner: "after_dinner",
  "after dinner": "after_dinner",
  after_supper: "after_dinner",
  "after supper": "after_dinner",
  before_food: "before_food",
  "before food": "before_food",
  "before meals": "before_food",
  before_meals: "before_food",
  after_food: "after_food",
  "after food": "after_food",
  "after meals": "after_food",
  after_meals: "after_food",
  before_sleep: "before_sleep",
  "before sleep": "before_sleep",
  "at bedtime": "before_sleep",
  bedtime: "before_sleep",
  hs: "before_sleep",
  empty_stomach: "empty_stomach",
  "empty stomach": "empty_stomach",
  fasting: "empty_stomach",
};

export function normalizeFoodInstruction(value?: string | null): FoodInstruction | undefined {
  if (!value?.trim()) return undefined;
  const key = value.trim().toLowerCase().replace(/\s+/g, " ");
  return NORMALIZE_MAP[key];
}

export function foodInstructionLabel(value?: FoodInstruction | string | null): string {
  if (!value) return "After Food";
  const normalized = normalizeFoodInstruction(value) ?? (value as FoodInstruction);
  return FOOD_INSTRUCTION_LABELS[normalized] ?? value;
}

export function foodInstructionFromLegacy(beforeFood?: boolean, afterFood?: boolean): FoodInstruction {
  if (beforeFood) return "before_food";
  if (afterFood) return "after_food";
  return "after_food";
}
