"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminPageShell } from "@/components/super-admin/page-shell";
import { PageHeader } from "@/components/super-admin/page-header";
import { DataCard } from "@/components/super-admin/data-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoader } from "@/components/shared/loading-spinner";
import api from "@/lib/api";
import type { IDoctor } from "@/types";

export function HospitalDoctorsContent() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<IDoctor[]>([]);
  const [loading, setLoading] = useState(true);

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

  const activeCount = doctors.filter((d) => d.isActive).length;

  return (
    <AdminPageShell>
      <PageHeader
        title="Doctors"
        description="Manage your hospital doctors and their profiles"
        icon={Stethoscope}
        badge={doctors.length}
      >
        <Button asChild>
          <Link href="/hospital/doctors/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Doctor
          </Link>
        </Button>
      </PageHeader>

      {doctors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="px-3 py-1">{activeCount} active</Badge>
          <Badge variant="outline" className="px-3 py-1">{doctors.length - activeCount} inactive</Badge>
        </div>
      )}

      {doctors.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="No doctors yet"
          description="Add your first doctor to start accepting appointments"
          actionLabel="Add Doctor"
          onAction={() => router.push("/hospital/doctors/new")}
        />
      ) : (
        <DataCard title="All Doctors" description="Doctors registered at your hospital" count={doctors.length}>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Doctor</TableHead>
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
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {doctor.profileImage ? (
                          <img src={doctor.profileImage} alt={doctor.name} className="h-9 w-9 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                            <Stethoscope className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{doctor.name}</p>
                          {doctor.qualification && (
                            <p className="text-xs text-muted-foreground">{doctor.qualification}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{doctor.specialization}</TableCell>
                    <TableCell>{doctor.experience} yrs</TableCell>
                    <TableCell>₹{doctor.consultationFee}</TableCell>
                    <TableCell>
                      <Badge variant={doctor.isActive ? "default" : "secondary"}>
                        {doctor.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/hospital/doctors/${doctor._id}/edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => toggleActive(doctor)}>
                          {doctor.isActive ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(doctor._id.toString())}
                        >
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
    </AdminPageShell>
  );
}
