"use client";

import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Analytics
        </h1>
        <p className="text-muted-foreground">Hospital, appointment, and patient analytics</p>
      </div>

      <Tabs defaultValue="hospitals">
        <TabsList>
          <TabsTrigger value="hospitals">Hospitals</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="users">Patients</TabsTrigger>
        </TabsList>

        <TabsContent value="hospitals" className="mt-4">
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
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
        </TabsContent>

        <TabsContent value="appointments" className="mt-4 space-y-4">
          <div className="flex gap-4">
            {appointmentReports?.byStatus.map((s) => (
              <div key={s.status} className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground">{s.status}</p>
                <p className="text-2xl font-bold">{s.count}</p>
              </div>
            ))}
          </div>
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
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
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
