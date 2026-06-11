"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Building2, Loader2, MapPin, Phone, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AdminPageShell } from "@/components/super-admin/page-shell";
import { PageHeader } from "@/components/super-admin/page-header";
import { PageLoader } from "@/components/shared/loading-spinner";
import { LogoUploadField } from "@/components/shared/logo-upload";
import api from "@/lib/api";
import type { IHospital } from "@/types";

const LocationPicker = dynamic(
  () => import("@/components/shared/location-picker").then((m) => ({ default: m.LocationPicker })),
  {
    ssr: false,
    loading: () => <div className="h-72 w-full rounded-lg border bg-muted animate-pulse" />,
  }
);

export function HospitalProfileContent() {
  const [profile, setProfile] = useState<Partial<IHospital>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get("/hospital/profile")
      .then((res) => setProfile(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put("/hospital/profile", profile);
      setProfile(res.data.data);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <AdminPageShell>
      <PageHeader
        title="Hospital Profile"
        description="Manage your hospital information and location"
        icon={Building2}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-4 w-4 text-primary" />
                  Basic Information
                </CardTitle>
                <CardDescription>Hospital name, logo, and description</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="hospitalName">Hospital Name</Label>
                  <Input
                    id="hospitalName"
                    value={profile.hospitalName || ""}
                    onChange={(e) => setProfile({ ...profile, hospitalName: e.target.value })}
                    required
                  />
                </div>
                <LogoUploadField
                  value={profile.logo}
                  onChange={(logo) => setProfile({ ...profile, logo })}
                />
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={profile.description || ""}
                    onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                    rows={4}
                    className="resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Phone className="h-4 w-4 text-primary" />
                  Contact
                </CardTitle>
                <CardDescription>Public contact details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profile.phone || ""}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={profile.email || ""} disabled />
                  <p className="text-xs text-muted-foreground">Contact super admin to change login email</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card className="h-full shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-4 w-4 text-primary" />
                  Hospital Location
                </CardTitle>
                <CardDescription>Search or click on the map to set your location</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <LocationPicker
                  mapHeight="320px"
                  value={{
                    address: profile.address || "",
                    city: profile.city,
                    state: profile.state,
                    country: profile.country,
                    latitude: profile.latitude,
                    longitude: profile.longitude,
                  }}
                  onChange={(location) =>
                    setProfile({
                      ...profile,
                      address: location.address,
                      city: location.city,
                      state: location.state,
                      country: location.country,
                      latitude: location.latitude,
                      longitude: location.longitude,
                    })
                  }
                />

                <Separator />

                <div className="space-y-4">
                  <p className="text-sm font-medium">Address Details</p>
                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      value={profile.address || ""}
                      onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={profile.city || ""}
                        onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={profile.state || ""}
                        onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={profile.country || ""}
                        onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving} className="min-w-36">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </AdminPageShell>
  );
}
