"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Upload, FileText, Trash2, Download, Eye, ScanLine, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoader } from "@/components/shared/loading-spinner";
import { PrescriptionReview } from "@/features/prescriptions/prescription-review";
import { DailyRoutineDialog } from "@/features/prescriptions/daily-routine-dialog";
import api from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { compressImageFile } from "@/utils/client-image-compress";
import { mergeDailyRoutine, type DailyRoutine } from "@/lib/daily-routine";
import { useAuth } from "@/hooks/use-auth";
import type { IPrescription } from "@/types";
import type { ExtractedMedicine } from "@/validations/extracted-medicine";

interface UploadResponse {
  success: boolean;
  medicines: ExtractedMedicine[];
  dailyRoutine?: DailyRoutine;
  data: IPrescription;
  message?: string;
}

interface PendingReview {
  prescriptionId: string;
  imageUrl: string;
  fileName: string;
  medicines: ExtractedMedicine[];
  extractedText?: string;
  dailyRoutine: DailyRoutine;
}

const OCR_STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  completed: { label: "Ready to Review", variant: "default" },
  applied: { label: "Applied", variant: "secondary" },
  failed: { label: "OCR Failed", variant: "destructive" },
  processing: { label: "Processing", variant: "outline" },
  pending: { label: "Pending", variant: "outline" },
};

export function PrescriptionsContent() {
  const searchParams = useSearchParams();
  const { user, setUser } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [prescriptions, setPrescriptions] = useState<IPrescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState<string | null>(null);
  const [preview, setPreview] = useState<IPrescription | null>(null);
  const [pendingReview, setPendingReview] = useState<PendingReview | null>(null);
  const [routineOpen, setRoutineOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [savingRoutine, setSavingRoutine] = useState(false);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const res = await api.get("/prescriptions");
      setPrescriptions(res.data.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPrescriptions(); }, []);

  useEffect(() => {
    if (searchParams.get("action") === "upload") fileRef.current?.click();
  }, [searchParams]);

  const openReviewFlow = (payload: PendingReview) => {
    setPendingReview(payload);
    setRoutineOpen(true);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadStage("Compressing image...");
    try {
      const compressed = await compressImageFile(file);
      setUploadStage("Scanning prescription with AI...");

      const formData = new FormData();
      formData.append("file", compressed);

      const res = await api.post<UploadResponse>("/prescriptions/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120_000,
      });

      const { medicines, data, dailyRoutine } = res.data;

      if (medicines?.length > 0) {
        openReviewFlow({
          prescriptionId: data._id.toString(),
          imageUrl: data.imageUrl,
          fileName: data.fileName,
          medicines,
          extractedText: data.extractedText,
          dailyRoutine: mergeDailyRoutine(dailyRoutine ?? user?.dailyRoutine),
        });
      } else {
        toast.success("Prescription uploaded");
      }

      fetchPrescriptions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      setUploadStage(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleRoutineSave = async (routine: DailyRoutine) => {
    setSavingRoutine(true);
    try {
      const res = await api.put("/users/routine", routine);
      if (user) {
        setUser({ ...user, dailyRoutine: res.data.data.dailyRoutine ?? routine });
      }
      setPendingReview((prev) => (prev ? { ...prev, dailyRoutine: routine } : prev));
      setRoutineOpen(false);
      setReviewOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save routine");
    } finally {
      setSavingRoutine(false);
    }
  };

  const handleConfirmReview = async (medicines: ExtractedMedicine[], routine: DailyRoutine) => {
    if (!pendingReview) return;

    setConfirming(true);
    try {
      const res = await api.post("/medicines/bulk-create", {
        prescriptionId: pendingReview.prescriptionId,
        medicines,
        dailyRoutine: routine,
      });

      toast.success(res.data.message || "Prescription applied");
      fetchPrescriptions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save medicines");
      throw err;
    } finally {
      setConfirming(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this prescription?")) return;
    try {
      await api.delete(`/prescriptions/${id}`);
      toast.success("Prescription deleted");
      fetchPrescriptions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const closeReviewFlow = () => {
    setReviewOpen(false);
    setRoutineOpen(false);
    setPendingReview(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Prescriptions</h1>
          <p className="text-muted-foreground">
            Upload a prescription, review extracted medicines, and confirm personalized reminders
          </p>
        </div>
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={handleUpload}
          />
          <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload Prescription
              </>
            )}
          </Button>
        </div>
      </div>

      {uploading && uploadStage && (
        <div className="flex items-center gap-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          <ScanLine className="h-5 w-5 animate-pulse text-primary" />
          {uploadStage}
        </div>
      )}

      {loading ? (
        <PageLoader />
      ) : prescriptions.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No prescriptions"
          description="Upload your prescription images to extract medicines and schedule reminders based on your daily routine."
          actionLabel="Upload Prescription"
          onAction={() => fileRef.current?.click()}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {prescriptions.map((rx) => {
            const statusInfo = OCR_STATUS_LABELS[rx.ocrStatus || "pending"];
            return (
              <Card key={rx._id.toString()} className="overflow-hidden">
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={rx.imageUrl} alt={rx.fileName} className="h-full w-full object-cover" />
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium truncate">{rx.fileName}</p>
                    <Badge variant={statusInfo?.variant || "outline"} className="shrink-0 text-xs">
                      {statusInfo?.label || rx.ocrStatus}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatDate(rx.uploadedAt)}</p>
                  {rx.extractedMedicines && rx.extractedMedicines.length > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {rx.extractedMedicines.length} medicine(s) extracted
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => setPreview(rx)}>
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <a href={rx.imageUrl} download={rx.fileName}>
                        <Download className="h-3 w-3" />
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive"
                      onClick={() => handleDelete(rx._id.toString())}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {pendingReview && (
        <>
          <DailyRoutineDialog
            open={routineOpen}
            onOpenChange={setRoutineOpen}
            initialRoutine={pendingReview.dailyRoutine}
            onSave={handleRoutineSave}
            saving={savingRoutine}
          />
          <PrescriptionReview
            open={reviewOpen}
            onOpenChange={(open) => {
              if (!open) closeReviewFlow();
              else setReviewOpen(true);
            }}
            imageUrl={pendingReview.imageUrl}
            fileName={pendingReview.fileName}
            prescriptionId={pendingReview.prescriptionId}
            medicines={pendingReview.medicines}
            dailyRoutine={pendingReview.dailyRoutine}
            extractedText={pendingReview.extractedText}
            onConfirm={handleConfirmReview}
            confirming={confirming}
          />
        </>
      )}

      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{preview?.fileName}</DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="space-y-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview.imageUrl} alt={preview.fileName} className="w-full rounded-lg" />
              {preview.extractedMedicines && preview.extractedMedicines.length > 0 && (
                <div className="rounded-lg bg-muted p-4">
                  <p className="mb-2 text-sm font-medium">Extracted Medicines</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {preview.extractedMedicines.map((med, i) => (
                      <li key={i}>
                        {med.medicineName}
                        {med.dosage ? ` (${med.dosage})` : ""}
                        {med.foodInstructionRaw ? ` — ${med.foodInstructionRaw}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {preview.extractedText && (
                <div className="rounded-lg bg-muted p-4">
                  <p className="mb-1 text-sm font-medium">OCR Result</p>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {preview.extractedText}
                  </p>
                </div>
              )}
              {preview.ocrError && (
                <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
                  {preview.ocrError}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
