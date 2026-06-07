"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Building2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoader } from "@/components/shared/loading-spinner";
import api from "@/lib/api";
import type { IHospital } from "@/types";
import type { HospitalCreateInput } from "@/validations/hospital";

const emptyForm: HospitalCreateInput = {
  hospitalName: "",
  email: "",
  password: "",
  address: "",
  city: "",
  state: "",
  country: "",
  description: "",
  phone: "",
  logo: "",
};

export function HospitalsAdminContent() {
  const [hospitals, setHospitals] = useState<(IHospital & { totalDoctors?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [editing, setEditing] = useState<IHospital | null>(null);
  const [resetId, setResetId] = useState<string | null>(null);
  const [form, setForm] = useState<HospitalCreateInput>(emptyForm);
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchHospitals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/hospitals?admin=true");
      setHospitals(res.data.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load hospitals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHospitals(); }, [fetchHospitals]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };

  const openEdit = (hospital: IHospital) => {
    setEditing(hospital);
    setForm({
      hospitalName: hospital.hospitalName,
      email: hospital.email,
      password: "",
      address: hospital.address,
      city: hospital.city ?? "",
      state: hospital.state ?? "",
      country: hospital.country ?? "",
      description: hospital.description ?? "",
      phone: hospital.phone ?? "",
      logo: hospital.logo ?? "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        const { password: _pw, ...updateData } = form;
        await api.put(`/hospitals/${editing._id}`, updateData);
        toast.success("Hospital updated");
      } else {
        await api.post("/hospitals", form);
        toast.success("Hospital created with login credentials");
      }
      setDialogOpen(false);
      fetchHospitals();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetId) return;
    setSubmitting(true);
    try {
      await api.put(`/hospitals/${resetId}/reset-password`, { password: newPassword });
      toast.success("Password reset successfully");
      setPasswordOpen(false);
      setNewPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (hospital: IHospital) => {
    const status = hospital.status === "active" ? "inactive" : "active";
    try {
      await api.put(`/hospitals/${hospital._id}`, { status });
      toast.success(`Hospital ${status === "active" ? "activated" : "deactivated"}`);
      fetchHospitals();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Status update failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this hospital?")) return;
    try {
      await api.delete(`/hospitals/${id}`);
      toast.success("Hospital deleted");
      fetchHospitals();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hospital Management</h1>
          <p className="text-muted-foreground">Create hospitals with login credentials</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Add Hospital</Button>
      </div>

      {hospitals.length === 0 ? (
        <EmptyState icon={Building2} title="No hospitals" description="Create your first hospital" />
      ) : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Doctors</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hospitals.map((hospital) => (
                <TableRow key={hospital._id.toString()}>
                  <TableCell className="font-medium">{hospital.hospitalName}</TableCell>
                  <TableCell>{hospital.email}</TableCell>
                  <TableCell>{hospital.city || "-"}</TableCell>
                  <TableCell>{hospital.totalDoctors ?? 0}</TableCell>
                  <TableCell><Badge variant={hospital.status === "active" ? "default" : "secondary"}>{hospital.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(hospital)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="sm" variant="outline" onClick={() => { setResetId(hospital._id.toString()); setPasswordOpen(true); }}><KeyRound className="h-4 w-4" /></Button>
                      <Button size="sm" variant="outline" onClick={() => toggleStatus(hospital)}>{hospital.status === "active" ? "Deactivate" : "Activate"}</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(hospital._id.toString())}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Hospital" : "Create Hospital"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Hospital Name</Label><Input value={form.hospitalName} onChange={(e) => setForm({ ...form, hospitalName: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Email (Login)</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required disabled={!!editing} /></div>
            {!editing && <div className="space-y-2"><Label>Password</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></div>}
            <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="space-y-2"><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
              <div className="space-y-2"><Label>State</Label><Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Country</Label><Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div>
            <div className="space-y-2"><Label>Logo URL</Label><Input value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <Button type="submit" className="w-full" disabled={submitting}>{submitting ? "Saving..." : editing ? "Update" : "Create"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reset Hospital Password</DialogTitle></DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2"><Label>New Password</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} /></div>
            <Button type="submit" className="w-full" disabled={submitting}>{submitting ? "Resetting..." : "Reset Password"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
