"use client";

import { useEffect, useState } from "react";
import { BarChart3, Building2, Calendar, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AdminPageShell } from "@/components/super-admin/page-shell";
import { PageHeader } from "@/components/super-admin/page-header";
import { DataCard } from "@/components/super-admin/data-card";
import { AdminStatCard } from "@/components/super-admin/admin-stat-card";
import { PageLoader } from "@/components/shared/loading-spinner";
import api from "@/lib/api";

export function ReportsAdminContent() {
  const [hospitalReports, setHospitalReports] = useState<Record<string, unknown>[]>([]);
  const [appointmentReports, setAppointmentReports] = useState<{
    byStatus: { status: string; count: number }[];
    recent: Record<string, unknown>[];
  } | null>(null);
  const [userReports, setUserReports] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/super-admin/reports?type=hospitals"),
      api.get("/super-admin/reports?type=appointments"),
      api.get("/super-admin/reports?type=users"),
    ])
      .then(([h, a, u]) => {
        setHospitalReports(h.data.data);
        setAppointmentReports(a.data.data);
        setUserReports(u.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const totalAppointments = appointmentReports?.byStatus.reduce((sum, s) => sum + s.count, 0) ?? 0;

  return (
    <AdminPageShell>
      <PageHeader
        title="Analytics"
        description="Hospital, appointment, and patient insights across the platform"
        icon={BarChart3}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <AdminStatCard
          title="Hospitals"
          value={hospitalReports.length}
          icon={Building2}
          variant="blue"
        />
        <AdminStatCard
          title="Total Appointments"
          value={totalAppointments}
          icon={Calendar}
          variant="orange"
        />
        <AdminStatCard
          title="Patients"
          value={userReports.length}
          icon={Users}
          variant="pink"
        />
      </div>

      <Tabs defaultValue="hospitals">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="hospitals">Hospitals ({hospitalReports.length})</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="users">Patients ({userReports.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="hospitals" className="mt-4">
          <DataCard title="Hospital Performance" count={hospitalReports.length}>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Hospital</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Doctors</TableHead>
                    <TableHead>Appointments</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hospitalReports.map((h) => (
                    <TableRow key={String(h._id)}>
                      <TableCell className="font-medium">{String(h.hospitalName ?? h.name)}</TableCell>
                      <TableCell><Badge>{String(h.status)}</Badge></TableCell>
                      <TableCell>{Number(h.totalDoctors)}</TableCell>
                      <TableCell>{Number(h.totalAppointments)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </DataCard>
        </TabsContent>

        <TabsContent value="appointments" className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {appointmentReports?.byStatus.map((s) => (
              <AdminStatCard
                key={s.status}
                title={s.status}
                value={s.count}
                icon={Calendar}
                variant={s.status === "BOOKED" ? "blue" : s.status === "COMPLETED" ? "green" : "orange"}
              />
            ))}
          </div>
          <DataCard title="Recent Appointments" count={appointmentReports?.recent.length}>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Patient</TableHead>
                    <TableHead>Hospital</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointmentReports?.recent.map((a) => (
                    <TableRow key={String(a._id)}>
                      <TableCell>{(a.userId as { name?: string })?.name}</TableCell>
                      <TableCell>{(a.hospitalId as { name?: string })?.name}</TableCell>
                      <TableCell>{(a.doctorId as { name?: string })?.name}</TableCell>
                      <TableCell><Badge>{String(a.status)}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </DataCard>
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <DataCard title="Patient Directory" count={userReports.length}>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Appointments</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userReports.map((u) => (
                    <TableRow key={String(u._id)}>
                      <TableCell className="font-medium">{String(u.name)}</TableCell>
                      <TableCell>{String(u.email)}</TableCell>
                      <TableCell>{Number(u.totalAppointments)}</TableCell>
                      <TableCell>{new Date(String(u.createdAt)).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </DataCard>
        </TabsContent>
      </Tabs>
    </AdminPageShell>
  );
}
