"use client";

import { useEffect, useState } from "react";
import { Stethoscope, UserCheck, Calendar, Users } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { PageLoader } from "@/components/shared/loading-spinner";
import api from "@/lib/api";
import type { HospitalDashboardStats } from "@/types";

export function HospitalDashboardContent() {
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hospital Dashboard</h1>
        <p className="text-muted-foreground">Overview of your hospital operations</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Doctors" value={stats?.totalDoctors ?? 0} icon={Stethoscope} />
        <StatCard title="Active Doctors" value={stats?.activeDoctors ?? 0} icon={UserCheck} />
        <StatCard title="Today's Appointments" value={stats?.todayAppointments ?? 0} icon={Calendar} />
        <StatCard title="Total Patients" value={stats?.totalPatients ?? 0} icon={Users} />
      </div>
    </div>
  );
}
