"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, MapPin, Phone, Mail, Stethoscope, ArrowLeft, Pencil, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminPageShell } from "@/components/super-admin/page-shell";
import { PageHeader } from "@/components/super-admin/page-header";
import { PageLoader } from "@/components/shared/loading-spinner";
import { HospitalMap } from "@/components/shared/hospital-map";
import api from "@/lib/api";
import type { IHospital, IDoctor } from "@/types";

interface HospitalDetail extends IHospital {
  doctors: IDoctor[];
  totalDoctors: number;
}

export function SuperAdminHospitalDetailContent({ hospitalId }: { hospitalId: string }) {
  const [hospital, setHospital] = useState<HospitalDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/hospitals/${hospitalId}`)
      .then((res) => setHospital(res.data.data))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load hospital"))
      .finally(() => setLoading(false));
  }, [hospitalId]);

  if (loading) return <PageLoader />;
  if (!hospital) return <p>Hospital not found</p>;

  const locationParts = [hospital.city, hospital.state, hospital.country].filter(Boolean);

  return (
    <AdminPageShell>
      <PageHeader
        title={hospital.hospitalName}
        description="Hospital profile and registered doctors"
        icon={Building2}
        badge={hospital.status}
      >
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/super-admin/hospitals">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/super-admin/hospitals/${hospitalId}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </PageHeader>

      <Card className="overflow-hidden shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 sm:flex-row">
            {hospital.logo ? (
              <img src={hospital.logo} alt={hospital.hospitalName} className="h-24 w-24 rounded-xl object-cover ring-1 ring-border" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                <Building2 className="h-12 w-12 text-primary" />
              </div>
            )}
            <div className="flex-1 space-y-3">
              {hospital.description && (
                <p className="max-w-2xl text-muted-foreground">{hospital.description}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {hospital.address}
                  {locationParts.length > 0 && `, ${locationParts.join(", ")}`}
                </span>
                {hospital.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-4 w-4 shrink-0" />
                    {hospital.phone}
                  </span>
                )}
                {hospital.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-4 w-4 shrink-0" />
                    {hospital.email}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {hospital.latitude != null && hospital.longitude != null && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4 text-primary" />
                Location
              </CardTitle>
              <CardDescription>Hospital on map</CardDescription>
            </CardHeader>
            <CardContent>
              <HospitalMap
                latitude={hospital.latitude}
                longitude={hospital.longitude}
                hospitalName={hospital.hospitalName}
              />
            </CardContent>
          </Card>
        )}

        <Card className={`shadow-sm ${hospital.latitude == null ? "lg:col-span-2" : ""}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-primary" />
              Doctors
              <Badge variant="secondary" className="ml-1 font-normal">
                {hospital.totalDoctors}
              </Badge>
            </CardTitle>
            <CardDescription>Active doctors at this hospital</CardDescription>
          </CardHeader>
          <CardContent>
            {hospital.doctors.length === 0 ? (
              <p className="text-sm text-muted-foreground">No doctors registered yet.</p>
            ) : (
              <div className="space-y-3">
                {hospital.doctors.map((doctor) => (
                  <div
                    key={doctor._id.toString()}
                    className="flex items-center gap-4 rounded-lg border bg-muted/20 p-3"
                  >
                    {doctor.profileImage ? (
                      <img src={doctor.profileImage} alt={doctor.name} className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Stethoscope className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{doctor.name}</p>
                      <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                      <p className="text-xs text-muted-foreground">
                        {doctor.experience} yrs · ₹{doctor.consultationFee}
                      </p>
                    </div>
                    <Badge>Active</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPageShell>
  );
}
