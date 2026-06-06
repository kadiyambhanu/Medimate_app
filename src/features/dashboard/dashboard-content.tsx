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
import { StatCard } from "@/components/shared/stat-card";
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {user?.name?.split(" ")[0]}!
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s your health overview for today
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm">
            <Link href="/medicines?action=add">
              <Plus className="h-4 w-4" />
              Add Medicine
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Medicines"
          value={stats.totalMedicines}
          icon={Pill}
          iconClassName="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <StatCard
          title="Active Medicines"
          value={stats.activeMedicines}
          icon={Activity}
          iconClassName="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
        />
        <StatCard
          title="Today's Doses"
          value={stats.todayMedicines}
          icon={Calendar}
          iconClassName="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
        />
        <StatCard
          title="Missed Today"
          value={stats.missedMedicines}
          icon={AlertTriangle}
          iconClassName="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Upcoming Reminders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.upcomingReminders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming reminders</p>
            ) : (
              stats.upcomingReminders.map((reminder) => (
                <div key={reminder._id.toString()} className="flex items-center justify-between rounded-lg border p-3">
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
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
              <Link href="/medicines?action=add">
                <Pill className="h-6 w-6 text-primary" />
                <span>Add Medicine</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
              <Link href="/reminders?action=add">
                <Bell className="h-6 w-6 text-primary" />
                <span>Set Reminder</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
              <Link href="/prescriptions?action=upload">
                <FileText className="h-6 w-6 text-primary" />
                <span>Upload Rx</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
              <Link href="/reports">
                <TrendingUp className="h-6 w-6 text-primary" />
                <span>View Reports</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
