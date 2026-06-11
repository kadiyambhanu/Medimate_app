"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Pill,
  Activity,
  Calendar,
  AlertTriangle,
  Plus,
  Bell,
  FileText,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  LayoutDashboard,
  ArrowRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AdminPageShell } from "@/components/super-admin/page-shell";
import { PageHeader } from "@/components/super-admin/page-header";
import { AdminStatCard } from "@/components/super-admin/admin-stat-card";
import { PageLoader } from "@/components/shared/loading-spinner";
import { useAuth } from "@/hooks/use-auth";
import api from "@/lib/api";
import { formatTime } from "@/lib/utils";
import type { DashboardStats } from "@/types";

export function DashboardContent() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/dashboard")
      .then((res) => setStats(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;
  if (!stats) return null;

  const quickLinks = [
    { href: "/medicines?action=add", label: "Add Medicine", icon: Pill, description: "Track a new medication" },
    { href: "/reminders?action=add", label: "Set Reminder", icon: Bell, description: "Schedule dose alerts" },
    { href: "/prescriptions?action=upload", label: "Upload Rx", icon: FileText, description: "Scan a prescription" },
    { href: "/appointments", label: "Book Appointment", icon: Calendar, description: "Visit a hospital doctor" },
  ];

  return (
    <AdminPageShell>
      <PageHeader
        title={`Welcome back, ${user?.name?.split(" ")[0] || "there"}!`}
        description="Here's your health overview for today"
        icon={LayoutDashboard}
      >
        <Button asChild>
          <Link href="/medicines?action=add">
            <Plus className="mr-2 h-4 w-4" />
            Add Medicine
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard title="Total Medicines" value={stats.totalMedicines} icon={Pill} variant="blue" />
        <AdminStatCard title="Active Medicines" value={stats.activeMedicines} icon={Activity} variant="green" />
        <AdminStatCard title="Today's Doses" value={stats.todayMedicines} icon={Calendar} variant="purple" />
        <AdminStatCard title="Missed Today" value={stats.missedMedicines} icon={AlertTriangle} variant="orange" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Weekly Adherence
            </CardTitle>
            <CardDescription>Your medicine adherence over the past 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="mb-1 flex justify-between text-sm">
                  <span>Overall Adherence</span>
                  <span className="font-semibold">{stats.adherenceRate}%</span>
                </div>
                <Progress value={stats.adherenceRate} className="h-2" />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.weeklyAdherence}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Legend />
                <Bar dataKey="taken" name="Taken" fill="hsl(173, 58%, 39%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="missed" name="Missed" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4 text-primary" />
              Upcoming Reminders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.upcomingReminders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming reminders</p>
            ) : (
              stats.upcomingReminders.map((reminder) => (
                <div key={reminder._id.toString()} className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                  <div>
                    <p className="text-sm font-medium">
                      {(reminder.medicineId as { medicineName?: string })?.medicineName}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatTime(reminder.reminderTime)}</p>
                  </div>
                  <Badge variant="outline">
                    <Clock className="mr-1 h-3 w-3" />
                    Pending
                  </Badge>
                </div>
              ))
            )}
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="/reminders">View All</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <CardDescription>Your latest medicine events</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            ) : (
              stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  {activity.type === "taken" ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-500" />
                  ) : activity.type === "missed" ? (
                    <XCircle className="mt-0.5 h-5 w-5 text-red-500" />
                  ) : (
                    <Clock className="mt-0.5 h-5 w-5 text-blue-500" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.description}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
            <CardDescription>Common tasks to stay on track</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <link.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{link.label}</p>
                    <p className="text-xs text-muted-foreground">{link.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminPageShell>
  );
}
