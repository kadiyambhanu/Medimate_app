"use client";

import { Settings, Shield, Mail, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AdminPageShell } from "@/components/super-admin/page-shell";
import { PageHeader } from "@/components/super-admin/page-header";
import { InfoRow } from "@/components/super-admin/info-row";

export default function SuperAdminSettingsPage() {
  const { user } = useAuth();

  return (
    <AdminPageShell>
      <PageHeader
        title="Settings"
        description="Super admin account and platform access"
        icon={Settings}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4 text-primary" />
              Account Details
            </CardTitle>
            <CardDescription>Your super admin profile information</CardDescription>
          </CardHeader>
          <CardContent className="divide-y">
            <InfoRow label="Full Name" value={user?.name || "—"} />
            <InfoRow
              label="Email"
              value={
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  {user?.email}
                </span>
              }
            />
            <InfoRow label="Role" value={<Badge>{user?.role}</Badge>} />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-primary" />
              Platform Access
            </CardTitle>
            <CardDescription>Permissions granted to your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm font-medium">Super Administrator</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Full access to hospitals, doctors, appointments, prescriptions, and analytics.
              </p>
            </div>
            <Separator />
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Manage hospitals and credentials
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Oversee doctors and appointments
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Upload and apply prescriptions
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                View platform analytics
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AdminPageShell>
  );
}
