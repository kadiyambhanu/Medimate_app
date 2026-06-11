"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Building2,
  Building,
  Stethoscope,
  Calendar,
  Users,
  ArrowRight,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminPageShell } from "@/components/super-admin/page-shell";
import { PageHeader } from "@/components/super-admin/page-header";
import { AdminStatCard } from "@/components/super-admin/admin-stat-card";
import { PageLoader } from "@/components/shared/loading-spinner";
import api from "@/lib/api";
import type { SuperAdminStats } from "@/types";

const quickLinks = [
  { href: "/super-admin/hospitals/new", label: "Add Hospital", icon: Building2, description: "Register a new hospital" },
  { href: "/super-admin/hospitals", label: "Manage Hospitals", icon: Building, description: "View all hospitals" },
  { href: "/super-admin/doctors", label: "Manage Doctors", icon: Stethoscope, description: "Doctor activation status" },
  { href: "/super-admin/appointments", label: "Appointments", icon: Calendar, description: "View & reschedule" },
];

export function SuperAdminDashboardContent() {
  const [stats, setStats] = useState<SuperAdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/super-admin/dashboard")
      .then((res) => setStats(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  return (
    <AdminPageShell>
      <PageHeader
        title="Dashboard"
        description="Platform-wide healthcare management overview"
        icon={Building2}
      >
        <Button asChild>
          <Link href="/super-admin/hospitals/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Hospital
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <AdminStatCard title="Total Hospitals" value={stats?.totalHospitals ?? 0} icon={Building2} variant="blue" />
        <AdminStatCard title="Active Hospitals" value={stats?.activeHospitals ?? 0} icon={Building} variant="green" />
        <AdminStatCard title="Total Doctors" value={stats?.totalDoctors ?? 0} icon={Stethoscope} variant="purple" />
        <AdminStatCard title="Appointments" value={stats?.totalAppointments ?? 0} icon={Calendar} variant="orange" />
        <AdminStatCard title="Patients" value={stats?.totalPatients ?? 0} icon={Users} variant="pink" />
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
          <CardDescription>Common super admin tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <link.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{link.label}</p>
                  <p className="truncate text-xs text-muted-foreground">{link.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
