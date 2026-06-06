"use client";

import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { PageLoader } from "@/components/shared/loading-spinner";
import { useAuth } from "@/hooks/use-auth";
import api from "@/lib/api";
import { getInitials } from "@/lib/utils";
import { LANGUAGES } from "@/lib/constants";
import { profileSchema, changePasswordSchema, type ProfileInput, type ChangePasswordInput } from "@/validations/profile";

export function ProfileContent() {
  const { user, setUser, fetchUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const profileForm = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
  });

  const passwordForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  useEffect(() => {
    api
      .get("/profile")
      .then((res) => {
        const data = res.data.data;
        profileForm.reset({
          name: data.name,
          phone: data.phone || "",
          avatar: data.avatar || "",
          language: data.language || "en",
          notificationSettings: data.notificationSettings,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [profileForm]);

  const handleProfileSave = async (data: ProfileInput) => {
    setSaving(true);
    try {
      const res = await api.put("/profile", data);
      setUser(res.data.data);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (data: ChangePasswordInput) => {
    setSaving(true);
    try {
      await api.put("/profile", data);
      toast.success("Password changed");
      passwordForm.reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Password change failed");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      profileForm.setValue("avatar", res.data.data.imageUrl);
      toast.success("Photo uploaded. Save profile to apply.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  };

  if (loading) return <PageLoader />;

  const notifSettings = profileForm.watch("notificationSettings");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your profile details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={profileForm.handleSubmit(handleProfileSave)} className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profileForm.watch("avatar")} />
                    <AvatarFallback className="text-lg bg-primary/10 text-primary">
                      {user ? getInitials(user.name) : <User />}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                    <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                      <Camera className="h-4 w-4" /> Change Photo
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input {...profileForm.register("name")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input {...profileForm.register("phone")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={user?.email || ""} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select value={profileForm.watch("language")} onValueChange={(v) => profileForm.setValue("language", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map((l) => (
                          <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="animate-spin" />} Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
                <div className="space-y-2">
                  <Label>Current Password</Label>
                  <Input type="password" {...passwordForm.register("currentPassword")} />
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="text-sm text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input type="password" {...passwordForm.register("newPassword")} />
                  {passwordForm.formState.errors.newPassword && (
                    <p className="text-sm text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Confirm New Password</Label>
                  <Input type="password" {...passwordForm.register("confirmPassword")} />
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="animate-spin" />} Change Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure how you receive alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "email" as const, label: "Email Notifications", desc: "Receive alerts via email" },
                { key: "push" as const, label: "Push Notifications", desc: "Browser push notifications" },
                { key: "sms" as const, label: "SMS Notifications", desc: "Text message alerts" },
                { key: "reminderAlerts" as const, label: "Reminder Alerts", desc: "Upcoming dose reminders" },
                { key: "missedDoseAlerts" as const, label: "Missed Dose Alerts", desc: "Alerts when doses are missed" },
              ].map((setting, i) => (
                <div key={setting.key}>
                  {i > 0 && <Separator className="my-4" />}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{setting.label}</p>
                      <p className="text-sm text-muted-foreground">{setting.desc}</p>
                    </div>
                    <Switch
                      checked={notifSettings?.[setting.key] ?? true}
                      onCheckedChange={(checked) =>
                        profileForm.setValue(`notificationSettings.${setting.key}`, checked)
                      }
                    />
                  </div>
                </div>
              ))}
              <Button
                onClick={() => profileForm.handleSubmit(handleProfileSave)()}
                disabled={saving}
                className="mt-4"
              >
                {saving && <Loader2 className="animate-spin" />} Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
