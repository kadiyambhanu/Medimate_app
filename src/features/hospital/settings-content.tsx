"use client";

import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function HospitalSettingsContent() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Hospital account settings</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Account</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between"><span className="text-muted-foreground">Hospital</span><span className="font-medium">{user?.hospitalName}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{user?.email}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Role</span><Badge>{user?.role}</Badge></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant={user?.status === "active" ? "default" : "secondary"}>{user?.status}</Badge></div>
          <p className="text-sm text-muted-foreground pt-2">Contact your super admin to reset your password.</p>
        </CardContent>
      </Card>
    </div>
  );
}
