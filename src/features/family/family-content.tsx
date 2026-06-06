"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Users, Trash2, Phone, Mail, Edit } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoader } from "@/components/shared/loading-spinner";
import api from "@/lib/api";
import { RELATION_TYPES } from "@/lib/constants";
import { familyMemberSchema, type FamilyMemberInput } from "@/validations/family";
import type { IFamilyMember } from "@/types";

export function FamilyContent() {
  const [members, setMembers] = useState<IFamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMember, setEditMember] = useState<IFamilyMember | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FamilyMemberInput>({
    resolver: zodResolver(familyMemberSchema),
    defaultValues: { memberName: "", phone: "", email: "", relation: "" },
  });

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/family");
      setMembers(res.data.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, []);

  const handleSubmit = async (data: FamilyMemberInput) => {
    setSubmitting(true);
    try {
      if (editMember) {
        await api.put(`/family/${editMember._id}`, data);
        toast.success("Family member updated");
      } else {
        await api.post("/family", data);
        toast.success("Family member added");
      }
      setDialogOpen(false);
      setEditMember(null);
      form.reset();
      fetchMembers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (member: IFamilyMember) => {
    setEditMember(member);
    form.reset({
      memberName: member.memberName,
      phone: member.phone || "",
      email: member.email || "",
      relation: member.relation,
    });
    setDialogOpen(true);
  };

  const handleRemove = async (id: string) => {
    if (!confirm("Remove this family member?")) return;
    try {
      await api.delete(`/family/${id}`);
      toast.success("Family member removed");
      fetchMembers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Family Monitoring</h1>
          <p className="text-muted-foreground">Add family members to monitor their health</p>
        </div>
        <Button onClick={() => { setEditMember(null); form.reset(); setDialogOpen(true); }}>
          <Plus className="h-4 w-4" /> Add Member
        </Button>
      </div>

      {loading ? (
        <PageLoader />
      ) : members.length === 0 ? (
        <EmptyState icon={Users} title="No family members" description="Add family members to monitor their medicine adherence." actionLabel="Add Member" onAction={() => setDialogOpen(true)} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <Card key={member._id.toString()}>
              <CardContent className="p-5">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{member.memberName}</h3>
                    <p className="text-sm text-primary">{member.relation}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(member)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleRemove(member._id.toString())}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                {member.phone && (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" /> {member.phone}
                  </p>
                )}
                {member.email && (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3 w-3" /> {member.email}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editMember ? "Edit Family Member" : "Add Family Member"}</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input {...form.register("memberName")} placeholder="Member name" />
              {form.formState.errors.memberName && (
                <p className="text-sm text-destructive">{form.formState.errors.memberName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Relationship</Label>
              <Select value={form.watch("relation")} onValueChange={(v) => form.setValue("relation", v)}>
                <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
                <SelectContent>
                  {RELATION_TYPES.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input {...form.register("phone")} placeholder="+1 234 567 8900" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input {...form.register("email")} type="email" placeholder="email@example.com" />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {editMember ? "Update Member" : "Add Member"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
