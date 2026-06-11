"use client";

import { Settings, Building2, Mail, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AdminPageShell } from "@/components/super-admin/page-shell";
import { PageHeader } from "@/components/super-admin/page-header";
import { InfoRow } from "@/components/super-admin/info-row";
import { useAuth } from "@/hooks/use-auth";

export function HospitalSettingsContent() {
  const { user } = useAuth();

  return (
    <AdminPageShell>
      <PageHeader
        title="Settings"
        description="Hospital account and access information"
        icon={Settings}
      />

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-primary" />
            Account Details
          </CardTitle>
          <CardDescription>Your hospital login and account status</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <InfoRow label="Hospital Name" value={user?.hospitalName || "—"} />
          <Separator />
          <InfoRow
            label="Email"
            value={
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                {user?.email || "—"}
              </span>
            }
          />
          <Separator />
          <InfoRow
            label="Role"
            value={
              <Badge variant="outline" className="font-normal">
                <Shield className="mr-1 h-3 w-3" />
                {user?.role || "HOSPITAL"}
              </Badge>
            }
          />
          <Separator />
          <InfoRow
            label="Status"
            value={
              <Badge variant={user?.status === "active" ? "default" : "secondary"}>
                {user?.status || "—"}
              </Badge>
            }
          />
          <div className="mt-4 rounded-lg bg-muted/50 px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Contact your super admin to reset your password or update login credentials.
            </p>
          </div>
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
