"use client";

import { useCallback, useEffect, useState } from "react";
import { Stethoscope, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminPageShell } from "@/components/super-admin/page-shell";
import { PageHeader } from "@/components/super-admin/page-header";
import { DataCard } from "@/components/super-admin/data-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoader } from "@/components/shared/loading-spinner";
import api from "@/lib/api";
import type { IDoctor, IHospital } from "@/types";

type DoctorWithHospital = IDoctor & { hospitalId: IHospital | string };

export function DoctorsAdminContent() {
  const [doctors, setDoctors] = useState<DoctorWithHospital[]>([]);
  const [hospitals, setHospitals] = useState<IHospital[]>([]);
  const [hospitalFilter, setHospitalFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = hospitalFilter !== "all" ? `?admin=true&hospitalId=${hospitalFilter}` : "?admin=true";
      const [doctorsRes, hospitalsRes] = await Promise.all([
        api.get(`/doctors${params}`),
        api.get("/hospitals?admin=true"),
      ]);
      setDoctors(doctorsRes.data.data);
      setHospitals(hospitalsRes.data.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [hospitalFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleActive = async (doctor: DoctorWithHospital) => {
    try {
      await api.put(`/doctors/${doctor._id}`, { isActive: !doctor.isActive });
      toast.success(doctor.isActive ? "Doctor deactivated" : "Doctor activated");
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Status update failed");
    }
  };

  if (loading) return <PageLoader />;

  const activeCount = doctors.filter((d) => d.isActive).length;

  return (
    <AdminPageShell>
      <PageHeader
        title="Doctors"
        description="View all doctors across hospitals and manage activation"
        icon={Stethoscope}
        badge={doctors.length}
      >
        <Select value={hospitalFilter} onValueChange={setHospitalFilter}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Filter by hospital" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Hospitals</SelectItem>
            {hospitals.map((h) => (
              <SelectItem key={h._id.toString()} value={h._id.toString()}>
                {h.hospitalName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PageHeader>

      {doctors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="px-3 py-1">{activeCount} active</Badge>
          <Badge variant="outline" className="px-3 py-1">{doctors.length - activeCount} inactive</Badge>
        </div>
      )}

      {doctors.length === 0 ? (
        <EmptyState icon={Stethoscope} title="No doctors found" description="Doctors are added by hospitals" />
      ) : (
        <DataCard title="Doctor Directory" count={doctors.length}>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Doctor</TableHead>
                  <TableHead>Hospital</TableHead>
                  <TableHead>Specialization</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doctors.map((doctor) => {
                  const hospital = typeof doctor.hospitalId === "object" ? doctor.hospitalId : null;
                  return (
                    <TableRow key={doctor._id.toString()}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                            <Stethoscope className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium">{doctor.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Building2 className="h-3.5 w-3.5" />
                          {hospital?.hospitalName || "—"}
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
                        <Button size="sm" variant="outline" onClick={() => toggleActive(doctor)}>
                          {doctor.isActive ? "Deactivate" : "Activate"}
                        </Button>
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
