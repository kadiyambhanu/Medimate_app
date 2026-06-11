"use client";

import { useCallback, useEffect, useState } from "react";
import { Upload, FileText, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import type { IPrescription, IUser, IAppointment } from "@/types";

export function PrescriptionsAdminContent() {
  const [users, setUsers] = useState<IUser[]>([]);
  const [appointments, setAppointments] = useState<IAppointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<IPrescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState("");
  const [appointmentId, setAppointmentId] = useState("");
  const [autoApply, setAutoApply] = useState(true);
  const [file, setFile] = useState<File | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, appointmentsRes] = await Promise.all([
        api.get("/super-admin/users"),
        api.get("/appointments?admin=true"),
      ]);
      setUsers(usersRes.data.data);
      setAppointments(appointmentsRes.data.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    api.get("/super-admin/prescriptions").then((res) => setPrescriptions(res.data.data)).catch(() => {});
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !userId) {
      toast.error("Select a user and file");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", userId);
      if (appointmentId) formData.append("appointmentId", appointmentId);
      formData.append("autoApply", String(autoApply));

      const appointment = appointments.find((a) => String(a._id) === appointmentId);
      if (appointment?.doctorId) {
        const doctorId =
          typeof appointment.doctorId === "object" && appointment.doctorId !== null
            ? String((appointment.doctorId as { _id: unknown })._id)
            : String(appointment.doctorId);
        formData.append("doctorId", doctorId);
      }

      const res = await fetch("/api/prescriptions/admin-upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.message);

      toast.success(data.message);
      setFile(null);
      setPrescriptions((prev) => [data.data, ...prev]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleApply = async (id: string) => {
    try {
      await api.post(`/prescriptions/${id}/apply`);
      toast.success("Prescription applied to user");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Apply failed");
    }
  };

  const userAppointments = appointments.filter((a) => {
    const uid =
      typeof a.userId === "object" && a.userId !== null
        ? String((a.userId as { _id: unknown })._id)
        : String(a.userId);
    return uid === userId && a.status !== "CANCELLED";
  });

  if (loading) return <PageLoader />;

  return (
    <AdminPageShell>
      <PageHeader
        title="Prescriptions"
        description="Upload prescriptions and attach them to patients"
        icon={FileText}
        badge={prescriptions.length}
      />

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Upload className="h-4 w-4 text-primary" />
            Upload Prescription
          </CardTitle>
          <CardDescription>Select a patient, attach an optional appointment, and upload the prescription file</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Patient *</Label>
                <Select value={userId} onValueChange={setUserId}>
                  <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u._id.toString()} value={u._id.toString()}>
                        {u.name} ({u.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Appointment (optional)</Label>
                <Select value={appointmentId} onValueChange={setAppointmentId}>
                  <SelectTrigger><SelectValue placeholder="Link to appointment" /></SelectTrigger>
                  <SelectContent>
                    {userAppointments.map((a) => (
                      <SelectItem key={a._id.toString()} value={a._id.toString()}>
                        {new Date(a.appointmentDate).toLocaleDateString()} — {a.slotTime}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Prescription File *</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="cursor-pointer"
                />
              </div>
              {file && <p className="text-xs text-muted-foreground">Selected: {file.name}</p>}
            </div>

            <label className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2.5 text-sm">
              <Checkbox checked={autoApply} onCheckedChange={(v) => setAutoApply(!!v)} />
              Auto-create medicines and reminders after OCR
            </label>

            <Button type="submit" disabled={uploading || !file || !userId}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload & Process
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {prescriptions.length === 0 ? (
        <EmptyState icon={FileText} title="No prescriptions yet" description="Upload a prescription to get started" />
      ) : (
        <DataCard title="Uploaded Prescriptions" count={prescriptions.length}>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>File</TableHead>
                  <TableHead>OCR Status</TableHead>
                  <TableHead>Medicines Found</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prescriptions.map((rx) => (
                  <TableRow key={rx._id.toString()}>
                    <TableCell className="font-medium">{rx.fileName}</TableCell>
                    <TableCell>
                      <Badge variant={rx.ocrStatus === "completed" ? "default" : "secondary"}>
                        {rx.ocrStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>{rx.extractedMedicines?.length ?? 0}</TableCell>
                    <TableCell className="text-right">
                      {rx.ocrStatus === "completed" && (
                        <Button size="sm" onClick={() => handleApply(rx._id.toString())}>
                          <Check className="mr-1 h-4 w-4" />
                          Apply
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DataCard>
      )}
    </AdminPageShell>
  );
}
