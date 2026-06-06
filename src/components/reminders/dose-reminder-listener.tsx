"use client";

import { useDoseReminder } from "@/hooks/use-dose-reminder";

export function DoseReminderListener() {
  useDoseReminder();
  return null;
}
