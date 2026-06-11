"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Stethoscope,
  GraduationCap,
  IndianRupee,
  Loader2,
  Save,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminPageShell } from "@/components/super-admin/page-shell";
import { PageHeader } from "@/components/super-admin/page-header";
import { PageLoader } from "@/components/shared/loading-spinner";
import { LogoUploadField } from "@/components/shared/logo-upload";
import api from "@/lib/api";

interface DoctorFormData {
  name: string;
  specialization: string;
  qualification: string;
  experience: number;
  consultationFee: number;
  description: string;
  profileImage: string;
}

const emptyForm: DoctorFormData = {
  name: "",
  specialization: "",
  qualification: "",
  experience: 0,
  consultationFee: 0,
  description: "",
  profileImage: "",
};

interface DoctorFormContentProps {
  mode: "create" | "edit";
  doctorId?: string;
}

export function DoctorFormContent({ mode, doctorId }: DoctorFormContentProps) {
  const router = useRouter();
  const [form, setForm] = useState<DoctorFormData>(emptyForm);
  const [loading, setLoading] = useState(mode === "edit");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (mode !== "edit" || !doctorId) return;

    api
      .get(`/hospital/doctors/${doctorId}`)
      .then((res) => {
        const doctor = res.data.data;
        setForm({
          name: doctor.name,
          specialization: doctor.specialization,
          qualification: doctor.qualification ?? "",
          experience: doctor.experience ?? 0,
          consultationFee: doctor.consultationFee ?? 0,
          description: doctor.description ?? "",
          profileImage: doctor.profileImage ?? "",
        });
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load doctor"))
      .finally(() => setLoading(false));
  }, [mode, doctorId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "edit" && doctorId) {
        await api.put(`/hospital/doctors/${doctorId}`, form);
        toast.success("Doctor updated successfully");
      } else {
        await api.post("/hospital/doctors", form);
        toast.success("Doctor added successfully");
      }
      router.push("/hospital/doctors");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoader />;

  const isCreate = mode === "create";

  return (
    <AdminPageShell className="pb-24">
      <PageHeader
        title={isCreate ? "Add Doctor" : "Edit Doctor"}
        description={
          isCreate
            ? "Register a new doctor at your hospital"
            : "Update doctor profile and consultation details"
        }
        icon={Stethoscope}
      >
        <Button variant="outline" asChild>
          <Link href="/hospital/doctors">Cancel</Link>
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4 text-primary" />
                  Profile
                </CardTitle>
                <CardDescription>Doctor name, photo, and bio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <LogoUploadField
                  label="Profile Photo"
                  value={form.profileImage}
                  onChange={(profileImage) => setForm({ ...form, profileImage })}
                  folder="doctors"
                  variant="avatar"
                  fallbackIcon={Stethoscope}
                  alt={form.name || "Doctor profile"}
                  uploadLabel="Upload Photo"
                  changeLabel="Change Photo"
                />
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Dr. Priya Sharma"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">About</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Brief bio, areas of expertise, languages spoken..."
                    rows={4}
                    className="resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  Professional Details
                </CardTitle>
                <CardDescription>Specialization and qualifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="specialization">Specialization *</Label>
                    <Input
                      id="specialization"
                      value={form.specialization}
                      onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                      placeholder="e.g. Cardiology, Pediatrics"
                      required
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="qualification">Qualification</Label>
                    <Input
                      id="qualification"
                      value={form.qualification}
                      onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                      placeholder="e.g. MBBS, MD"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experience">Experience (years)</Label>
                    <Input
                      id="experience"
                      type="number"
                      min={0}
                      value={form.experience || ""}
                      onChange={(e) => setForm({ ...form, experience: Number(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 lg:col-span-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <IndianRupee className="h-4 w-4 text-primary" />
                  Consultation
                </CardTitle>
                <CardDescription>Fee shown to patients when booking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="consultationFee">Consultation Fee (₹)</Label>
                  <Input
                    id="consultationFee"
                    type="number"
                    min={0}
                    value={form.consultationFee || ""}
                    onChange={(e) => setForm({ ...form, consultationFee: Number(e.target.value) || 0 })}
                    placeholder="500"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden shadow-sm">
              <CardHeader className="border-b bg-muted/20">
                <CardTitle className="text-base">Preview</CardTitle>
                <CardDescription>How this doctor appears to patients</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  {form.profileImage ? (
                    <img
                      src={form.profileImage}
                      alt={form.name || "Doctor"}
                      className="h-24 w-24 rounded-full object-cover ring-2 ring-primary/20"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                      <Stethoscope className="h-10 w-10 text-primary" />
                    </div>
                  )}
                  <h3 className="mt-4 text-lg font-semibold">
                    {form.name || "Doctor Name"}
                  </h3>
                  {form.specialization && (
                    <Badge variant="secondary" className="mt-2 font-normal">
                      {form.specialization}
                    </Badge>
                  )}
                  {form.qualification && (
                    <p className="mt-2 text-sm text-muted-foreground">{form.qualification}</p>
                  )}
                  <div className="mt-4 flex flex-wrap justify-center gap-3 text-sm text-muted-foreground">
                    {form.experience > 0 && <span>{form.experience} yrs experience</span>}
                    {form.consultationFee > 0 && <span>₹{form.consultationFee} consultation</span>}
                  </div>
                  {form.description && (
                    <p className="mt-4 line-clamp-4 text-sm text-muted-foreground">{form.description}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto flex max-w-7xl items-center justify-end gap-3 px-4 py-4 sm:px-6 lg:px-8">
            <Button type="button" variant="outline" asChild>
              <Link href="/hospital/doctors">Cancel</Link>
            </Button>
            <Button type="submit" disabled={submitting} className="min-w-36">
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isCreate ? "Add Doctor" : "Save Changes"}
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </AdminPageShell>
  );
}
