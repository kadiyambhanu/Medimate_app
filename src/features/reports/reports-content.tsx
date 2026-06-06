"use client";

import { useEffect, useState } from "react";
import { Download, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageLoader } from "@/components/shared/loading-spinner";
import api from "@/lib/api";

interface ReportData {
  period: string;
  summary: { total: number; taken: number; missed: number; pending: number; adherenceRate: number };
  medicineStats: { medicineId: string; medicineName: string; total: number; taken: number; missed: number; adherence: number }[];
  dailyBreakdown: Record<string, { taken: number; missed: number; pending: number }>;
  generatedAt: string;
}

const COLORS = ["hsl(173, 58%, 39%)", "hsl(0, 84%, 60%)", "hsl(45, 93%, 47%)"];

export function ReportsContent() {
  const [period, setPeriod] = useState("weekly");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/reports?period=${period}`)
      .then((res) => setData(res.data.data))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [period]);

  const downloadPDF = () => {
    if (!data) return;
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("MediMate - Medicine Adherence Report", 14, 22);
    doc.setFontSize(12);
    doc.text(`Period: ${data.period} | Generated: ${new Date(data.generatedAt).toLocaleString()}`, 14, 32);
    doc.text(`Adherence Rate: ${data.summary.adherenceRate}%`, 14, 42);
    doc.text(`Taken: ${data.summary.taken} | Missed: ${data.summary.missed} | Total: ${data.summary.total}`, 14, 50);

    autoTable(doc, {
      startY: 58,
      head: [["Medicine", "Total", "Taken", "Missed", "Adherence %"]],
      body: data.medicineStats.map((m) => [
        m.medicineName, m.total, m.taken, m.missed, `${m.adherence}%`,
      ]),
    });

    doc.save(`medimate-report-${period}-${Date.now()}.pdf`);
    toast.success("Report downloaded");
  };

  const pieData = data
    ? [
        { name: "Taken", value: data.summary.taken },
        { name: "Missed", value: data.summary.missed },
        { name: "Pending", value: data.summary.pending },
      ]
    : [];

  const dailyData = data
    ? Object.entries(data.dailyBreakdown).map(([date, stats]) => ({
        date: date.slice(5),
        ...stats,
      }))
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">Analyze your medicine adherence patterns</p>
        </div>
        <Button onClick={downloadPDF} disabled={!data}>
          <Download className="h-4 w-4" /> Download PDF
        </Button>
      </div>

      <Tabs value={period} onValueChange={setPeriod}>
        <TabsList>
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
        </TabsList>

        {loading ? (
          <PageLoader />
        ) : data ? (
          <TabsContent value={period} className="space-y-6 mt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" /> Dose Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label>
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Daily Breakdown</CardTitle>
                  <CardDescription>Taken vs missed doses per day</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="taken" name="Taken" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="missed" name="Missed" fill={COLORS[1]} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle>Medicine-wise Adherence</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.medicineStats.map((med) => (
                    <div key={med.medicineId} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{med.medicineName}</span>
                        <span>{med.adherence}% ({med.taken}/{med.total})</span>
                      </div>
                      <Progress value={med.adherence} className="h-2" />
                    </div>
                  ))}
                  {data.medicineStats.length === 0 && (
                    <p className="text-sm text-muted-foreground">No medicine data for this period</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}
