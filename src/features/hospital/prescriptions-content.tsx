"use client";

import { useCallback, useEffect, useState } from "react";
import { Upload, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminPageShell } from "@/components/super-admin/page-shell";
import { PageHeader } from "@/components/super-admin/page-header";
import { DataCard } from "@/components/super-admin/data-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoader } from "@/components/shared/loading-spinner";
import api from "@/lib/api";

export function HospitalPrescriptionsContent() {
  const [prescriptions, setPrescriptions] = useState<Record<string, unknown>[]>([]);
  const [appointments, setAppointments] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [appointmentId, setAppointmentId] = useState("");
  const [autoApply, setAutoApply] = useState(true);
  const [file, setFile] = useState<File | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rxRes, aptRes] = await Promise.all([
        api.get("/hospital/prescriptions"),
        api.get("/hospital/appointments"),
      ]);
      setPrescriptions(rxRes.data.data);
      setAppointments(aptRes.data.data.filter((a: { status: string }) => a.status !== "CANCELLED"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !appointmentId) {
      toast.error("Select appointment and file");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("appointmentId", appointmentId);
      formData.append("autoApply", String(autoApply));

      const res = await fetch("/api/hospital/prescriptions/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success(data.message);
      setFile(null);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <AdminPageShell>
      <PageHeader
        title="Prescriptions"
        description="Upload and manage patient prescriptions"
        icon={FileText}
        badge={prescriptions.length}
      />

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Upload className="h-4 w-4 text-primary" />
            Upload Prescription
          </CardTitle>
          <CardDescription>Attach a prescription image to a patient appointment</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-2">
              <Label>Appointment</Label>
              <Select value={appointmentId} onValueChange={setAppointmentId}>
                <SelectTrigger className="max-w-lg">
                  <SelectValue placeholder="Select appointment" />
                </SelectTrigger>
                <SelectContent>
                  {appointments.map((a) => {
                    const user = a.userId as { name?: string } | null;
                    return (
                      <SelectItem key={String(a._id)} value={String(a._id)}>
                        {user?.name} — {new Date(String(a.appointmentDate)).toLocaleDateString()} {String(a.slotTime)}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prescription Image</Label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
                />
              </div>
              {file && <p className="text-xs text-muted-foreground">Selected: {file.name}</p>}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={autoApply} onCheckedChange={(v) => setAutoApply(!!v)} />
              Auto-create medicines and reminders for patient
            </label>
            <Button type="submit" disabled={uploading || !file || !appointmentId}>
              {uploading ? "Processing..." : "Upload & Process"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {prescriptions.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No prescriptions yet"
          description="Upload a prescription after a patient appointment"
        />
      ) : (
        <DataCard title="All Prescriptions" description="Uploaded patient prescriptions" count={prescriptions.length}>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prescriptions.map((rx) => {
                  const user = rx.userId as { name?: string } | null;
                  const doctor = rx.doctorId as { name?: string } | null;
                  return (
                    <TableRow key={String(rx._id)}>
                      <TableCell className="font-medium">{user?.name || "—"}</TableCell>
                      <TableCell>{doctor?.name || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{String(rx.ocrStatus)}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {rx.uploadedAt ? new Date(String(rx.uploadedAt)).toLocaleDateString() : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </DataCard>
      )}
    </AdminPageShell>
  );
}
