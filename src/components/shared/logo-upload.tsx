"use client";

import { useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Building2, Camera, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

interface LogoUploadFieldProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  folder?: string;
  alt?: string;
  variant?: "logo" | "avatar";
  fallbackIcon?: LucideIcon;
  uploadLabel?: string;
  changeLabel?: string;
}

export function LogoUploadField({
  value,
  onChange,
  label = "Hospital Logo",
  folder = "hospitals",
  alt = "Uploaded image",
  variant = "logo",
  fallbackIcon: FallbackIcon = Building2,
  uploadLabel = "Upload Logo",
  changeLabel = "Change Logo",
}: LogoUploadFieldProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      const res = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onChange(res.data.data.imageUrl);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-4 rounded-lg border bg-muted/20 p-4">
        <div
          className={cn(
            "relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden border bg-background",
            variant === "avatar" ? "rounded-full" : "rounded-xl"
          )}
        >
          {value ? (
            <>
              <img src={value} alt={alt} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onChange("")}
                className="absolute right-1 top-1 rounded-full bg-background/90 p-0.5 shadow-sm hover:bg-background"
                aria-label="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
            </>
          ) : (
            <FallbackIcon className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        <div className="space-y-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => void handleUpload(e)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
            <span className="ml-2">
              {uploading ? "Uploading..." : value ? changeLabel : uploadLabel}
            </span>
          </Button>
          <p className="text-xs text-muted-foreground">PNG, JPG, or WebP up to 5MB</p>
        </div>
      </div>
    </div>
  );
}
