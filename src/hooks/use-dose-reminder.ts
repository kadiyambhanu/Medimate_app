"use client";

import { useCallback, useEffect, useRef } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { playDoseReminderSound, unlockReminderSound } from "@/utils/reminder-sound";
import type { IMedicine, IReminder } from "@/types";

const CHECK_INTERVAL_MS = 30_000;
const ALERTED_KEY = "medimate-dose-alerts";

function getAlertedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const stored = sessionStorage.getItem(ALERTED_KEY);
    return stored ? new Set(JSON.parse(stored) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function markAlerted(id: string) {
  const alerted = getAlertedIds();
  alerted.add(id);
  sessionStorage.setItem(ALERTED_KEY, JSON.stringify([...alerted]));
}

function getMedicineName(reminder: IReminder): string {
  const medicine = reminder.medicineId;
  if (typeof medicine === "object" && medicine !== null && "medicineName" in medicine) {
    return (medicine as IMedicine).medicineName;
  }
  return "your medicine";
}

function isDue(reminder: IReminder, now: Date): string | null {
  if (reminder.status !== "pending") return null;

  const today = format(now, "yyyy-MM-dd");
  const scheduled = format(new Date(reminder.scheduledDate), "yyyy-MM-dd");
  if (scheduled !== today) return null;

  if (reminder.snoozedUntil) {
    const snoozeUntil = new Date(reminder.snoozedUntil);
    if (now < snoozeUntil) return null;
    return `${reminder._id.toString()}-snooze-${format(snoozeUntil, "yyyy-MM-dd-HH:mm")}`;
  }

  const currentTime = format(now, "HH:mm");
  const reminderTime = reminder.reminderTime.slice(0, 5);
  if (currentTime !== reminderTime) return null;

  return `${reminder._id.toString()}-${today}-${reminderTime}`;
}

function showBrowserNotification(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  new Notification(title, { body, icon: "/window.svg" });
}

export function useDoseReminder() {
  const { user } = useAuth();
  const alertedRef = useRef(getAlertedIds());

  const checkReminders = useCallback(async () => {
    if (!user?.notificationSettings?.reminderAlerts) return;

    const now = new Date();
    const today = format(now, "yyyy-MM-dd");

    try {
      const { data } = await api.get(`/reminders?date=${today}&status=pending`);
      const reminders: IReminder[] = data.data || [];

      for (const reminder of reminders) {
        const alertKey = isDue(reminder, now);
        if (!alertKey || alertedRef.current.has(alertKey)) continue;

        const medicineName = getMedicineName(reminder);
        const timeLabel = formatTime12(reminder.reminderTime);

        playDoseReminderSound();
        toast.info(`Time for ${medicineName}`, {
          description: `Take your ${medicineName} dose (${timeLabel})`,
          duration: 15_000,
        });
        showBrowserNotification("Dose Reminder", `Time to take ${medicineName} (${timeLabel})`);

        alertedRef.current.add(alertKey);
        markAlerted(alertKey);
      }
    } catch {
      // Silently ignore polling errors
    }
  }, [user?.notificationSettings?.reminderAlerts]);

  useEffect(() => {
    alertedRef.current = getAlertedIds();
  }, []);

  useEffect(() => {
    const unlock = () => unlockReminderSound();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    checkReminders();
    const interval = setInterval(checkReminders, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [user, checkReminders]);
}

function formatTime12(time: string): string {
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${minutes} ${ampm}`;
}
