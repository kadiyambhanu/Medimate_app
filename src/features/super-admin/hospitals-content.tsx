"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Building2, KeyRound, Mail, MapPin, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminPageShell } from "@/components/super-admin/page-shell";
import { PageHeader } from "@/components/super-admin/page-header";
import { DataCard } from "@/components/super-admin/data-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoader } from "@/components/shared/loading-spinner";
import api from "@/lib/api";
import type { IHospital } from "@/types";

export function HospitalsAdminContent() {
  const router = useRouter();
  const [hospitals, setHospitals] = useState<(IHospital & { totalDoctors?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [resetId, setResetId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

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

  const filtered = hospitals.filter((h) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      h.hospitalName.toLowerCase().includes(q) ||
      h.email.toLowerCase().includes(q) ||
      (h.city?.toLowerCase().includes(q) ?? false)
    );
  });

  const activeCount = hospitals.filter((h) => h.status === "active").length;

  return (
    <AdminPageShell>
      <PageHeader
        title="Hospitals"
        description="Create hospitals and manage login credentials"
        icon={Building2}
        badge={hospitals.length}
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search hospitals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button asChild>
            <Link href="/super-admin/hospitals/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Hospital
            </Link>
          </Button>
        </div>
      </PageHeader>

      {hospitals.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="px-3 py-1">{activeCount} active</Badge>
          <Badge variant="outline" className="px-3 py-1">{hospitals.length - activeCount} inactive</Badge>
        </div>
      )}

      {hospitals.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No hospitals yet"
          description="Create your first hospital to get started"
          actionLabel="Add Hospital"
          onAction={() => router.push("/super-admin/hospitals/new")}
        />
      ) : (
        <DataCard title="All Hospitals" description="Click a row to view hospital details" count={filtered.length}>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Hospital</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Doctors</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((hospital) => (
                  <TableRow
                    key={hospital._id.toString()}
                    className="cursor-pointer"
                    onClick={() => router.push(`/super-admin/hospitals/${hospital._id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {hospital.logo ? (
                          <img src={hospital.logo} alt={hospital.hospitalName} className="h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-border" />
                        ) : (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <Building2 className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{hospital.hospitalName}</p>
                          <p className="text-xs text-muted-foreground">ID: {hospital._id.toString().slice(-6)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        {hospital.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {hospital.city || "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{hospital.totalDoctors ?? 0}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={hospital.status === "active" ? "default" : "secondary"}>
                        {hospital.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/super-admin/hospitals/${hospital._id}/edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setResetId(hospital._id.toString());
                            setPasswordOpen(true);
                          }}
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => toggleStatus(hospital)}>
                          {hospital.status === "active" ? "Deactivate" : "Activate"}
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(hospital._id.toString())}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DataCard>
      )}

      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Hospital Password</DialogTitle>
            <DialogDescription>Set a new login password for this hospital account.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}
