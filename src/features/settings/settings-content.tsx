"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTheme } from "next-themes";
import { Settings, Moon, Sun, Bell, Globe, Trash2, Clock } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import api from "@/lib/api";
import { LANGUAGES } from "@/lib/constants";
import { DEFAULT_DAILY_ROUTINE, mergeDailyRoutine, type DailyRoutine } from "@/lib/daily-routine";

interface SettingsForm {
  language: string;
  email: boolean;
  push: boolean;
  sms: boolean;
  reminderAlerts: boolean;
  missedDoseAlerts: boolean;
}

export function SettingsContent() {
  const { user, setUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [routine, setRoutine] = useState<DailyRoutine>(DEFAULT_DAILY_ROUTINE);

  const form = useForm<SettingsForm>({
    defaultValues: {
      language: "en",
      email: true,
      push: true,
      sms: false,
      reminderAlerts: true,
      missedDoseAlerts: true,
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        language: user.language || "en",
        ...user.notificationSettings,
      });
      setRoutine(mergeDailyRoutine(user.dailyRoutine));
    }
  }, [user, form]);

  const saveRoutine = async () => {
    try {
      const res = await api.put("/users/routine", routine);
      if (user) {
        setUser({ ...user, dailyRoutine: res.data.data.dailyRoutine ?? routine });
      }
      toast.success("Daily routine saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save routine");
    }
  };

  const saveSettings = async () => {
    const values = form.getValues();
    try {
      const res = await api.put("/users/profile", {
        language: values.language,
        notificationSettings: {
          email: values.email,
          push: values.push,
          sms: values.sms,
          reminderAlerts: values.reminderAlerts,
          missedDoseAlerts: values.missedDoseAlerts,
        },
      });
      setUser(res.data.data);
      toast.success("Settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
  };

  const deleteAccount = async () => {
    if (!confirm("This will permanently delete your account and all data. Continue?")) return;
    try {
      await api.delete("/users/account");
      await logout();
      router.push("/login");
      toast.success("Account deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete account");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your app preferences and account</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> Appearance</CardTitle>
          <CardDescription>Customize how MediMate looks</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            <Label>Dark Mode</Label>
          </div>
          <Switch checked={theme === "dark"} onCheckedChange={(v) => setTheme(v ? "dark" : "light")} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" /> Language</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={form.watch("language")} onValueChange={(v) => form.setValue("language", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Daily Routine</CardTitle>
          <CardDescription>
            Used to generate reminder times from prescription food instructions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {([
            ["wakeUp", "Wake-up Time"],
            ["breakfast", "Breakfast Time"],
            ["lunch", "Lunch Time"],
            ["dinner", "Dinner Time"],
            ["sleep", "Sleep Time"],
          ] as const).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <Label>{label}</Label>
              <input
                type="time"
                value={routine[key]}
                onChange={(e) => setRoutine((prev) => ({ ...prev, [key]: e.target.value }))}
                className="rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
          ))}
          <Button variant="outline" onClick={saveRoutine} className="w-full">
            Save Daily Routine
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Notifications</CardTitle>
          <CardDescription>Choose how you want to be notified</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "email" as const, label: "Email Notifications" },
            { key: "push" as const, label: "Push Notifications" },
            { key: "sms" as const, label: "SMS Alerts" },
            { key: "reminderAlerts" as const, label: "Reminder Alerts" },
            { key: "missedDoseAlerts" as const, label: "Missed Dose Alerts" },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <Label>{label}</Label>
              <Switch checked={form.watch(key)} onCheckedChange={(v) => form.setValue(key, v)} />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={saveSettings} className="flex-1">Save Settings</Button>
      </div>

      <Separator />

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Permanently delete your account and all associated data</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={deleteAccount}>
            <Trash2 className="h-4 w-4" /> Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
