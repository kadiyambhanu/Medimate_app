"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Stethoscope,
  UserCheck,
  Calendar,
  Users,
  Building2,
  Clock,
  FileText,
  ArrowRight,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminPageShell } from "@/components/super-admin/page-shell";
import { PageHeader } from "@/components/super-admin/page-header";
import { AdminStatCard } from "@/components/super-admin/admin-stat-card";
import { PageLoader } from "@/components/shared/loading-spinner";
import { useAuth } from "@/hooks/use-auth";
import api from "@/lib/api";
import type { HospitalDashboardStats } from "@/types";

const quickLinks = [
  { href: "/hospital/doctors", label: "Manage Doctors", icon: Stethoscope, description: "Add or edit doctors" },
  { href: "/hospital/schedules", label: "Doctor Schedules", icon: Clock, description: "Set availability slots" },
  { href: "/hospital/appointments", label: "Appointments", icon: Calendar, description: "View & manage bookings" },
  { href: "/hospital/prescriptions", label: "Prescriptions", icon: FileText, description: "Upload patient prescriptions" },
];

export function HospitalDashboardContent() {
  const { user } = useAuth();
  const [stats, setStats] = useState<HospitalDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/hospital/dashboard")
      .then((res) => setStats(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  return (
    <AdminPageShell>
      <PageHeader
        title="Dashboard"
        description={`Welcome back${user?.hospitalName ? `, ${user.hospitalName}` : ""}`}
        icon={Building2}
      >
        <Button asChild>
          <Link href="/hospital/doctors/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Doctor
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard title="Total Doctors" value={stats?.totalDoctors ?? 0} icon={Stethoscope} variant="purple" />
        <AdminStatCard title="Active Doctors" value={stats?.activeDoctors ?? 0} icon={UserCheck} variant="green" />
        <AdminStatCard title="Today's Appointments" value={stats?.todayAppointments ?? 0} icon={Calendar} variant="orange" />
        <AdminStatCard title="Total Patients" value={stats?.totalPatients ?? 0} icon={Users} variant="blue" />
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
          <CardDescription>Common hospital management tasks</CardDescription>
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
