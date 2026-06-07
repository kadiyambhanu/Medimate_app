"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, MapPin, Phone, Mail, Stethoscope, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/shared/loading-spinner";
import api from "@/lib/api";
import type { IHospital, IDoctor } from "@/types";

interface HospitalDetail extends IHospital {
  doctors: IDoctor[];
  totalDoctors: number;
}

export function HospitalDetailContent({ hospitalId }: { hospitalId: string }) {
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

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild>
        <Link href="/hospitals">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Hospitals
        </Link>
      </Button>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 sm:flex-row">
            {hospital.logo ? (
              <img src={hospital.logo} alt={hospital.hospitalName} className="h-24 w-24 rounded-xl object-cover" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-primary/10">
                <Building2 className="h-12 w-12 text-primary" />
              </div>
            )}
            <div className="flex-1 space-y-3">
              <h1 className="text-2xl font-bold">{hospital.hospitalName}</h1>
              {hospital.description && <p className="text-muted-foreground">{hospital.description}</p>}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{hospital.address}</span>
                {hospital.phone && <span className="flex items-center gap-1"><Phone className="h-4 w-4" />{hospital.phone}</span>}
                {hospital.email && <span className="flex items-center gap-1"><Mail className="h-4 w-4" />{hospital.email}</span>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-4 text-xl font-semibold">Available Doctors ({hospital.totalDoctors})</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hospital.doctors.map((doctor) => (
            <Link key={doctor._id.toString()} href={`/hospitals/${hospitalId}/doctors/${doctor._id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-4">
                  {doctor.profileImage ? (
                    <img src={doctor.profileImage} alt={doctor.name} className="h-14 w-14 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                      <Stethoscope className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium">{doctor.name}</h3>
                    <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                    <div className="mt-1 flex items-center gap-2 text-sm">
                      <span>{doctor.experience} yrs</span>
                      <span>·</span>
                      <span>₹{doctor.consultationFee}</span>
                    </div>
                  </div>
                  <Badge>Active</Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
