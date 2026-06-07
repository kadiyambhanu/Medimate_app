"use client";

import { useCallback, useEffect, useState } from "react";
import { Upload, FileText, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Prescription Management</h1>
        <p className="text-muted-foreground">Upload prescriptions and attach to users</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Prescription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>User</Label>
                <Select value={userId} onValueChange={setUserId}>
                  <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u._id.toString()} value={u._id.toString()}>{u.name} ({u.email})</SelectItem>
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
              <Label>Prescription Image</Label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={autoApply} onCheckedChange={(v) => setAutoApply(!!v)} />
              Auto-create medicines and reminders after OCR
            </label>
            <Button type="submit" disabled={uploading || !file || !userId}>
              {uploading ? "Processing..." : "Upload & Process"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {prescriptions.length > 0 && (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Medicines</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prescriptions.map((rx) => (
                <TableRow key={rx._id.toString()}>
                  <TableCell>{rx.fileName}</TableCell>
                  <TableCell>
                    <Badge>{rx.ocrStatus}</Badge>
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
      )}

      {prescriptions.length === 0 && (
        <div className="flex flex-col items-center py-12 text-muted-foreground">
          <FileText className="mb-4 h-12 w-12" />
          <p>Upload a prescription to get started</p>
        </div>
      )}
    </div>
  );
}
