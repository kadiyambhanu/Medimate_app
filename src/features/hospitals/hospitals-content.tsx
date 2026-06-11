"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, MapPin, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoader } from "@/components/shared/loading-spinner";
import { AdminPageShell } from "@/components/super-admin/page-shell";
import { PageHeader } from "@/components/super-admin/page-header";
import api from "@/lib/api";
import type { IHospital } from "@/types";

export function HospitalsContent() {
  const [hospitals, setHospitals] = useState<(IHospital & { totalDoctors?: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/hospitals")
      .then((res) => setHospitals(res.data.data))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load hospitals"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  return (
    <AdminPageShell>
      <PageHeader
        title="Hospitals"
        description="Browse hospitals and book appointments"
        icon={Building2}
        badge={hospitals.length || undefined}
      />

      {hospitals.length === 0 ? (
        <EmptyState icon={Building2} title="No hospitals available" description="Check back later" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hospitals.map((hospital) => (
            <Link key={hospital._id.toString()} href={`/hospitals/${hospital._id}`}>
              <Card className="h-full shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-start gap-4">
                    {hospital.logo ? (
                      <img src={hospital.logo} alt={hospital.hospitalName} className="h-14 w-14 rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10">
                        <Building2 className="h-7 w-7 text-primary" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold">{hospital.hospitalName}</h3>
                      <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="line-clamp-2">{hospital.address}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm">
                      <Stethoscope className="h-4 w-4 text-primary" />
                      {hospital.totalDoctors ?? 0} doctors
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </AdminPageShell>
  );
}
