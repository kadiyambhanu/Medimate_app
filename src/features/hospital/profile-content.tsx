"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoader } from "@/components/shared/loading-spinner";
import api from "@/lib/api";
import type { IHospital } from "@/types";

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hospital Profile</h1>
        <p className="text-muted-foreground">Manage your hospital information</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Hospital Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Hospital Name</Label>
              <Input value={profile.hospitalName || ""} onChange={(e) => setProfile({ ...profile, hospitalName: e.target.value })} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Logo URL</Label>
              <Input value={profile.logo || ""} onChange={(e) => setProfile({ ...profile, logo: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={profile.phone || ""} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={profile.email || ""} disabled />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Address</Label>
              <Input value={profile.address || ""} onChange={(e) => setProfile({ ...profile, address: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input value={profile.city || ""} onChange={(e) => setProfile({ ...profile, city: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input value={profile.state || ""} onChange={(e) => setProfile({ ...profile, state: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input value={profile.country || ""} onChange={(e) => setProfile({ ...profile, country: e.target.value })} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Description</Label>
              <Textarea value={profile.description || ""} onChange={(e) => setProfile({ ...profile, description: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
