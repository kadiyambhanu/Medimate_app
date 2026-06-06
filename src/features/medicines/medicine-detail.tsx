"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit, Trash2, Pill } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoader } from "@/components/shared/loading-spinner";
import api from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { IMedicine } from "@/types";

interface MedicineDetailProps {
  id: string;
}

export function MedicineDetail({ id }: MedicineDetailProps) {
  const router = useRouter();
  const [medicine, setMedicine] = useState<IMedicine | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/medicines/${id}`)
      .then((res) => setMedicine(res.data.data))
      .catch(() => toast.error("Medicine not found"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Delete this medicine?")) return;
    try {
      await api.delete(`/medicines/${id}`);
      toast.success("Medicine deleted");
      router.push("/medicines");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  if (loading) return <PageLoader />;
  if (!medicine) return <p className="text-muted-foreground">Medicine not found.</p>;

  const statusVariant = medicine.status === "active" ? "success" : medicine.status === "completed" ? "secondary" : "warning";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-3xl space-y-6"
    >
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/medicines"><ArrowLeft className="h-4 w-4" /> Back</Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/medicines/${id}/edit`}><Edit className="h-4 w-4" /> Edit</Link>
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Pill className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{medicine.medicineName}</CardTitle>
                {medicine.genericName && (
                  <p className="text-sm text-muted-foreground">{medicine.genericName}</p>
                )}
              </div>
            </div>
            <Badge variant={statusVariant}>{medicine.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Detail label="Dosage" value={medicine.dosage} />
            <Detail label="Quantity" value={String(medicine.quantity)} />
            <Detail label="Frequency" value={medicine.frequency} />
            <Detail label="Food Instruction" value={medicine.foodInstruction} />
            <Detail label="Start Date" value={formatDate(medicine.startDate)} />
            <Detail label="End Date" value={medicine.endDate ? formatDate(medicine.endDate) : "Ongoing"} />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">Timings</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(medicine.timings)
                .filter(([, v]) => v)
                .map(([k]) => (
                  <Badge key={k} variant="outline" className="capitalize">{k}</Badge>
                ))}
            </div>
          </div>

          {medicine.notes && (
            <div>
              <p className="mb-1 text-sm font-medium text-muted-foreground">Notes</p>
              <p className="text-sm">{medicine.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
