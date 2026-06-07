"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Stethoscope } from "lucide-react";
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
import type { IDoctor } from "@/types";

const emptyForm = {
  name: "",
  specialization: "",
  qualification: "",
  experience: 0,
  consultationFee: 0,
  description: "",
  profileImage: "",
};

export function HospitalDoctorsContent() {
  const [doctors, setDoctors] = useState<IDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<IDoctor | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/hospital/doctors");
      setDoctors(res.data.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load doctors");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };

  const openEdit = (doctor: IDoctor) => {
    setEditing(doctor);
    setForm({
      name: doctor.name,
      specialization: doctor.specialization,
      qualification: doctor.qualification ?? "",
      experience: doctor.experience,
      consultationFee: doctor.consultationFee,
      description: doctor.description ?? "",
      profileImage: doctor.profileImage ?? "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await api.put(`/hospital/doctors/${editing._id}`, form);
        toast.success("Doctor updated");
      } else {
        await api.post("/hospital/doctors", form);
        toast.success("Doctor added");
      }
      setDialogOpen(false);
      fetchDoctors();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (doctor: IDoctor) => {
    try {
      await api.put(`/hospital/doctors/${doctor._id}`, { isActive: !doctor.isActive });
      toast.success(doctor.isActive ? "Doctor deactivated" : "Doctor activated");
      fetchDoctors();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Status update failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this doctor?")) return;
    try {
      await api.delete(`/hospital/doctors/${id}`);
      toast.success("Doctor deleted");
      fetchDoctors();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Doctors</h1>
          <p className="text-muted-foreground">Manage your hospital doctors</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Add Doctor</Button>
      </div>

      {doctors.length === 0 ? (
        <EmptyState icon={Stethoscope} title="No doctors" description="Add your first doctor" />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doctors.map((doctor) => (
                <TableRow key={doctor._id.toString()}>
                  <TableCell className="font-medium">{doctor.name}</TableCell>
                  <TableCell>{doctor.specialization}</TableCell>
                  <TableCell>{doctor.experience} yrs</TableCell>
                  <TableCell>₹{doctor.consultationFee}</TableCell>
                  <TableCell><Badge variant={doctor.isActive ? "default" : "secondary"}>{doctor.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(doctor)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="sm" variant="outline" onClick={() => toggleActive(doctor)}>{doctor.isActive ? "Deactivate" : "Activate"}</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(doctor._id.toString())}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Doctor" : "Add Doctor"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Specialization</Label><Input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Qualification</Label><Input value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Experience</Label><Input type="number" value={form.experience} onChange={(e) => setForm({ ...form, experience: Number(e.target.value) })} /></div>
              <div className="space-y-2"><Label>Fee</Label><Input type="number" value={form.consultationFee} onChange={(e) => setForm({ ...form, consultationFee: Number(e.target.value) })} /></div>
            </div>
            <div className="space-y-2"><Label>Profile Image URL</Label><Input value={form.profileImage} onChange={(e) => setForm({ ...form, profileImage: e.target.value })} /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <Button type="submit" className="w-full" disabled={submitting}>{submitting ? "Saving..." : editing ? "Update" : "Add"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
