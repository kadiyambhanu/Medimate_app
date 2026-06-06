"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoader } from "@/components/shared/loading-spinner";
import { MedicineForm } from "./medicine-form";
import api from "@/lib/api";
import type { IMedicine } from "@/types";
import type { MedicineInput } from "@/validations/medicine";

interface MedicineEditProps {
  id: string;
}

export function MedicineEdit({ id }: MedicineEditProps) {
  const router = useRouter();
  const [medicine, setMedicine] = useState<IMedicine | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get(`/medicines/${id}`)
      .then((res) => setMedicine(res.data.data))
      .catch(() => toast.error("Medicine not found"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (data: MedicineInput) => {
    setSubmitting(true);
    try {
      await api.put(`/medicines/${id}`, data);
      toast.success("Medicine updated");
      router.push(`/medicines/${id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!medicine) return <p className="text-muted-foreground">Medicine not found.</p>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-2xl space-y-6"
    >
      <Button variant="ghost" asChild>
        <Link href={`/medicines/${id}`}><ArrowLeft className="h-4 w-4" /> Back to Details</Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Edit Medicine</CardTitle>
        </CardHeader>
        <CardContent>
          <MedicineForm
            defaultValues={medicine}
            isEditing
            onSubmit={handleSubmit}
            loading={submitting}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}
