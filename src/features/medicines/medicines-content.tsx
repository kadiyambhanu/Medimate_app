"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Search, Pill, ChevronDown, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoader } from "@/components/shared/loading-spinner";
import { AdminPageShell } from "@/components/super-admin/page-shell";
import { PageHeader } from "@/components/super-admin/page-header";
import { MedicineForm } from "./medicine-form";
import { MedicineCard } from "./medicine-card";
import api from "@/lib/api";
import { formatDate, cn } from "@/lib/utils";
import type { IMedicine } from "@/types";
import type { MedicineInput } from "@/validations/medicine";

interface MedicineGroup {
  prescriptionId: string;
  prescriptionName: string;
  uploadedAt: string;
  imageUrl: string;
  medicines: IMedicine[];
}

interface GroupedMedicinesResponse {
  groups: MedicineGroup[];
  ungrouped: IMedicine[];
  total: number;
}

function stripExtension(name: string): string {
  return name.replace(/\.[^.]+$/, "");
}

export function MedicinesContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<GroupedMedicinesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMedicine, setEditMedicine] = useState<IMedicine | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const fetchMedicines = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      const res = await api.get(`/medicines/grouped?${params}`);
      setData(res.data.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load medicines");
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    fetchMedicines();
  }, [fetchMedicines]);

  useEffect(() => {
    if (searchParams.get("action") === "add") {
      setEditMedicine(null);
      setDialogOpen(true);
    }
  }, [searchParams]);

  const toggleGroup = (groupId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const handleSubmit = async (formData: MedicineInput) => {
    setSubmitting(true);
    try {
      if (editMedicine) {
        await api.put(`/medicines/${editMedicine._id}`, formData);
        toast.success("Medicine updated");
      } else {
        await api.post("/medicines", formData);
        toast.success("Medicine added");
      }
      setDialogOpen(false);
      setEditMedicine(null);
      fetchMedicines();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this medicine?")) return;
    try {
      await api.delete(`/medicines/${id}`);
      toast.success("Medicine deleted");
      fetchMedicines();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const hasResults = Boolean(
    data && (data.groups.length > 0 || data.ungrouped.length > 0)
  );

  return (
    <AdminPageShell>
      <PageHeader
        title="Medicines"
        description="Medicines grouped by prescription — click a prescription to view its medications"
        icon={Pill}
        badge={data?.total}
      >
        <Button onClick={() => { setEditMedicine(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add Medicine
        </Button>
      </PageHeader>

      <Card className="shadow-sm">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search medicines..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={status || "all"} onValueChange={(v) => setStatus(v === "all" ? "" : v)}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        </CardContent>
      </Card>

      {loading ? (
        <PageLoader />
      ) : !hasResults ? (
        <EmptyState
          icon={Pill}
          title="No medicines found"
          description="Upload a prescription or add medicines manually to get started."
          actionLabel="Add Medicine"
          onAction={() => { setEditMedicine(null); setDialogOpen(true); }}
        />
      ) : (
        <div className="space-y-4">
          {data?.groups.map((group) => {
            const isOpen = expanded.has(group.prescriptionId);
            return (
              <Card key={group.prescriptionId} className="overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.prescriptionId)}
                  className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={group.imageUrl}
                      alt={group.prescriptionName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-primary" />
                      <h2 className="truncate font-semibold">
                        {stripExtension(group.prescriptionName)}
                      </h2>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Uploaded {formatDate(group.uploadedAt)} · {group.medicines.length} medicine(s)
                    </p>
                  </div>
                  <Badge variant="secondary">{group.medicines.length}</Badge>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>

                {isOpen && (
                  <CardContent className="border-t bg-muted/20 p-4 pt-4">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {group.medicines.map((medicine) => (
                        <MedicineCard
                          key={medicine._id.toString()}
                          medicine={medicine}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}

          {data && data.ungrouped.length > 0 && (
            <Card className="overflow-hidden">
              <button
                type="button"
                onClick={() => toggleGroup("manual")}
                className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-muted/50"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border bg-muted">
                  <Pill className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold">Added Manually</h2>
                  <p className="text-sm text-muted-foreground">
                    Medicines not linked to a prescription · {data.ungrouped.length} medicine(s)
                  </p>
                </div>
                <Badge variant="secondary">{data.ungrouped.length}</Badge>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
                    expanded.has("manual") && "rotate-180"
                  )}
                />
              </button>

              {expanded.has("manual") && (
                <CardContent className="border-t bg-muted/20 p-4 pt-4">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {data.ungrouped.map((medicine) => (
                      <MedicineCard
                        key={medicine._id.toString()}
                        medicine={medicine}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editMedicine ? "Edit Medicine" : "Add Medicine"}</DialogTitle>
          </DialogHeader>
          <MedicineForm
            defaultValues={editMedicine || undefined}
            isEditing={!!editMedicine}
            onSubmit={handleSubmit}
            loading={submitting}
          />
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}
