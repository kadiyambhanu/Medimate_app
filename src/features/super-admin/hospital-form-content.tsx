"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Building2,
  KeyRound,
  Loader2,
  MapPin,
  Phone,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AdminPageShell } from "@/components/super-admin/page-shell";
import { PageHeader } from "@/components/super-admin/page-header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageLoader } from "@/components/shared/loading-spinner";
import { LogoUploadField } from "@/components/shared/logo-upload";
import api from "@/lib/api";
import type { HospitalCreateInput } from "@/validations/hospital";

const LocationPicker = dynamic(
  () => import("@/components/shared/location-picker").then((m) => ({ default: m.LocationPicker })),
  {
    ssr: false,
    loading: () => <div className="h-72 w-full rounded-lg border bg-muted animate-pulse" />,
  }
);

const emptyForm: HospitalCreateInput = {
  hospitalName: "",
  email: "",
  password: "",
  address: "",
  city: "",
  state: "",
  country: "",
  latitude: undefined,
  longitude: undefined,
  description: "",
  phone: "",
  logo: "",
};

interface HospitalFormContentProps {
  mode: "create" | "edit";
  hospitalId?: string;
}

export function HospitalFormContent({ mode, hospitalId }: HospitalFormContentProps) {
  const router = useRouter();
  const [form, setForm] = useState<HospitalCreateInput>(emptyForm);
  const [loading, setLoading] = useState(mode === "edit");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (mode !== "edit" || !hospitalId) return;

    api
      .get(`/hospitals/${hospitalId}`)
      .then((res) => {
        const hospital = res.data.data;
        setForm({
          hospitalName: hospital.hospitalName,
          email: hospital.email,
          password: "",
          address: hospital.address,
          city: hospital.city ?? "",
          state: hospital.state ?? "",
          country: hospital.country ?? "",
          latitude: hospital.latitude,
          longitude: hospital.longitude,
          description: hospital.description ?? "",
          phone: hospital.phone ?? "",
          logo: hospital.logo ?? "",
        });
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load hospital"))
      .finally(() => setLoading(false));
  }, [mode, hospitalId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "edit" && hospitalId) {
        const { password: _pw, ...updateData } = form;
        await api.put(`/hospitals/${hospitalId}`, updateData);
        toast.success("Hospital updated successfully");
        router.push(`/super-admin/hospitals/${hospitalId}`);
      } else {
        await api.post("/hospitals", form);
        toast.success("Hospital created with login credentials");
        router.push("/super-admin/hospitals");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoader />;

  const isCreate = mode === "create";
  const backHref = mode === "edit" && hospitalId ? `/super-admin/hospitals/${hospitalId}` : "/super-admin/hospitals";

  return (
    <AdminPageShell className="pb-24">
      <PageHeader
        title={isCreate ? "Create Hospital" : "Edit Hospital"}
        description={
          isCreate
            ? "Register a new hospital and set up login access"
            : "Update hospital profile, contact, and location"
        }
        icon={Building2}
      >
        <Button variant="outline" asChild>
          <Link href={backHref}>Cancel</Link>
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-4 w-4 text-primary" />
                  Basic Information
                </CardTitle>
                <CardDescription>Hospital name, logo, and description</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="hospitalName">Hospital Name *</Label>
                  <Input
                    id="hospitalName"
                    value={form.hospitalName}
                    onChange={(e) => setForm({ ...form, hospitalName: e.target.value })}
                    placeholder="e.g. City Care Hospital"
                    required
                  />
                </div>
                <LogoUploadField
                  value={form.logo}
                  onChange={(logo) => setForm({ ...form, logo })}
                />
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Brief description about the hospital..."
                    rows={4}
                    className="resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <KeyRound className="h-4 w-4 text-primary" />
                  Login Access
                </CardTitle>
                <CardDescription>
                  {isCreate
                    ? "Credentials used by the hospital to sign in"
                    : "Login email cannot be changed here"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="hospital@example.com"
                    required
                    disabled={!isCreate}
                  />
                </div>
                {isCreate && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="Minimum 6 characters"
                      required
                      minLength={6}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Phone className="h-4 w-4 text-primary" />
                  Contact
                </CardTitle>
                <CardDescription>Public contact number for patients</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-4 w-4 text-primary" />
                  Hospital Location
                </CardTitle>
                <CardDescription>
                  Search, click on the map, or drag the pin to set the exact location
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <LocationPicker
                  mapHeight="320px"
                  value={{
                    address: form.address,
                    city: form.city,
                    state: form.state,
                    country: form.country,
                    latitude: form.latitude,
                    longitude: form.longitude,
                  }}
                  onChange={(location) =>
                    setForm({
                      ...form,
                      address: location.address,
                      city: location.city ?? "",
                      state: location.state ?? "",
                      country: location.country ?? "",
                      latitude: location.latitude,
                      longitude: location.longitude,
                    })
                  }
                />

                <Separator />

                <div className="space-y-4">
                  <p className="text-sm font-medium">Address Details</p>
                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address *</Label>
                    <Input
                      id="address"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="Full address from map or enter manually"
                      required
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        placeholder="City"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={form.state}
                        onChange={(e) => setForm({ ...form, state: e.target.value })}
                        placeholder="State"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={form.country}
                        onChange={(e) => setForm({ ...form, country: e.target.value })}
                        placeholder="Country"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto flex max-w-6xl items-center justify-end gap-3 px-4 py-4 sm:px-6">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                router.push(
                  mode === "edit" && hospitalId
                    ? `/super-admin/hospitals/${hospitalId}`
                    : "/super-admin/hospitals"
                )
              }
            >
              Cancel
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
                  {isCreate ? "Create Hospital" : "Save Changes"}
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </AdminPageShell>
  );
}
