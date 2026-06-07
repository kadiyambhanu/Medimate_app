"use client";

import { useCallback, useEffect, useState } from "react";
import { Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Doctor Management</h1>
          <p className="text-muted-foreground">View all doctors and manage activation status</p>
        </div>
        <Select value={hospitalFilter} onValueChange={setHospitalFilter}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Filter by hospital" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Hospitals</SelectItem>
            {hospitals.map((h) => (
              <SelectItem key={h._id.toString()} value={h._id.toString()}>{h.hospitalName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {doctors.length === 0 ? (
        <EmptyState icon={Stethoscope} title="No doctors" description="Doctors are added by hospitals" />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Hospital</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doctors.map((doctor) => {
                const hospital = typeof doctor.hospitalId === "object" ? doctor.hospitalId : null;
                return (
                  <TableRow key={doctor._id.toString()}>
                    <TableCell className="font-medium">{doctor.name}</TableCell>
                    <TableCell>{hospital?.hospitalName || "-"}</TableCell>
                    <TableCell>{doctor.specialization}</TableCell>
                    <TableCell>{doctor.experience} yrs</TableCell>
                    <TableCell><Badge variant={doctor.isActive ? "default" : "secondary"}>{doctor.isActive ? "Active" : "Inactive"}</Badge></TableCell>
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
      )}
    </div>
  );
}
