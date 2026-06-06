"use client";

import { useEffect, useState } from "react";
import { History, CheckCircle2, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { PageLoader } from "@/components/shared/loading-spinner";
import api from "@/lib/api";
import { formatTime } from "@/lib/utils";
import type { IReminder, IMedicine } from "@/types";

interface HistoryData {
  reminders: IReminder[];
  summary: { total: number; taken: number; missed: number; pending: number; adherenceRate: number };
}

export function HistoryContent() {
  const [period, setPeriod] = useState("daily");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/history?period=${period}&date=${date}`)
      .then((res) => setData(res.data.data))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [period, date]);

  const statusIcon = (status: string) => {
    if (status === "taken") return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    if (status === "missed") return <XCircle className="h-5 w-5 text-red-500" />;
    return <Clock className="h-5 w-5 text-amber-500" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Medicine History</h1>
        <p className="text-muted-foreground">Track your medication adherence over time</p>
      </div>

      <Tabs value={period} onValueChange={setPeriod}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full sm:w-48" />
        </div>

        {loading ? (
          <PageLoader />
        ) : (
          <TabsContent value={period} className="space-y-6 mt-6">
            {data && (
              <>
                <div className="grid gap-4 sm:grid-cols-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold">{data.summary.total}</p>
                      <p className="text-sm text-muted-foreground">Total Doses</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-emerald-600">{data.summary.taken}</p>
                      <p className="text-sm text-muted-foreground">Taken</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-red-600">{data.summary.missed}</p>
                      <p className="text-sm text-muted-foreground">Missed</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="mb-1 text-center text-2xl font-bold">{data.summary.adherenceRate}%</p>
                      <Progress value={data.summary.adherenceRate} className="h-2" />
                      <p className="mt-1 text-center text-sm text-muted-foreground">Adherence</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5" />
                      {period.charAt(0).toUpperCase() + period.slice(1)} Log
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {data.reminders.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No records for this period</p>
                    ) : (
                      data.reminders.map((r) => (
                        <div key={r._id.toString()} className="flex items-center justify-between rounded-lg border p-3">
                          <div className="flex items-center gap-3">
                            {statusIcon(r.status)}
                            <div>
                              <p className="text-sm font-medium">
                                {(r.medicineId as IMedicine)?.medicineName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(r.scheduledDate), "MMM d, yyyy")} at {formatTime(r.reminderTime)}
                              </p>
                            </div>
                          </div>
                          <Badge variant={r.status === "taken" ? "success" : r.status === "missed" ? "destructive" : "warning"}>
                            {r.status}
                          </Badge>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
