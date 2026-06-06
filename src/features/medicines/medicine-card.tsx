"use client";

import Link from "next/link";
import { Edit, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { IMedicine } from "@/types";

function statusVariant(status: string) {
  if (status === "active") return "success" as const;
  if (status === "completed") return "secondary" as const;
  return "warning" as const;
}

interface MedicineCardProps {
  medicine: IMedicine;
  onDelete: (id: string) => void;
}

export function MedicineCard({ medicine, onDelete }: MedicineCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="font-semibold">{medicine.medicineName}</h3>
            {medicine.genericName && (
              <p className="text-xs text-muted-foreground">{medicine.genericName}</p>
            )}
          </div>
          <Badge variant={statusVariant(medicine.status)}>{medicine.status}</Badge>
        </div>
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>Dosage: {medicine.dosage}</p>
          <p>Frequency: {medicine.frequency}</p>
          <p>Food: {medicine.foodInstruction}</p>
          {medicine.reminderTimes && medicine.reminderTimes.length > 0 && (
            <p>Reminders: {medicine.reminderTimes.join(", ")}</p>
          )}
          <p>Start: {formatDate(medicine.startDate)}</p>
        </div>
        <div className="mt-3 flex gap-1">
          {Object.entries(medicine.timings)
            .filter(([, value]) => value)
            .map(([slot]) => (
              <Badge key={slot} variant="outline" className="text-xs capitalize">
                {slot}
              </Badge>
            ))}
        </div>
        <div className="mt-4 flex gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link href={`/medicines/${medicine._id}`}>
              <Eye className="h-3 w-3" />
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/medicines/${medicine._id}/edit`}>
              <Edit className="h-3 w-3" />
            </Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-destructive"
            onClick={() => onDelete(medicine._id.toString())}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
