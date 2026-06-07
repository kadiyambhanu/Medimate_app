"use client";

import { useEffect, useState } from "react";
import { Building2, Building, Stethoscope, Calendar, Users } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { PageLoader } from "@/components/shared/loading-spinner";
import api from "@/lib/api";
import type { SuperAdminStats } from "@/types";

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform-wide healthcare management overview</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Total Hospitals" value={stats?.totalHospitals ?? 0} icon={Building2} />
        <StatCard title="Active Hospitals" value={stats?.activeHospitals ?? 0} icon={Building} />
        <StatCard title="Total Doctors" value={stats?.totalDoctors ?? 0} icon={Stethoscope} />
        <StatCard title="Total Appointments" value={stats?.totalAppointments ?? 0} icon={Calendar} />
        <StatCard title="Total Patients" value={stats?.totalPatients ?? 0} icon={Users} />
      </div>
    </div>
  );
}
