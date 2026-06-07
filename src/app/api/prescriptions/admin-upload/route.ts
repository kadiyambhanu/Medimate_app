import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { uploadToCloudinary, isCloudinaryEnabled } from "@/lib/cloudinary";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { ROLES } from "@/lib/constants";
import { prescriptionAttachSchema } from "@/validations/prescription-admin";
import { processPrescriptionUpload } from "@/services/prescription-admin.service";
import { compressForOcr } from "@/utils/image-compress";

export const maxDuration = 60;

async function persistImage(buffer: Buffer, originalName: string): Promise<string> {
  if (isCloudinaryEnabled()) {
    const result = await uploadToCloudinary(buffer, "medimate/prescriptions");
    return result.imageUrl;
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "prescriptions");
  await mkdir(uploadDir, { recursive: true });
  const fileName = `${Date.now()}-${originalName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  await writeFile(path.join(uploadDir, fileName), buffer);
  return `/uploads/prescriptions/${fileName}`;
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;
    const appointmentId = (formData.get("appointmentId") as string) || undefined;
    const doctorId = (formData.get("doctorId") as string) || undefined;
    const autoApply = formData.get("autoApply") === "true";

    const parsed = prescriptionAttachSchema.safeParse({
      userId,
      appointmentId,
      doctorId,
      autoApply,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: "Invalid file type. Use JPEG, PNG, WebP, GIF, or PDF." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const rawBuffer = Buffer.from(bytes);
    const { buffer, mimeType } = await compressForOcr(rawBuffer, file.type);
    const imageUrl = await persistImage(buffer, file.name);

    const result = await processPrescriptionUpload(
      parsed.data.userId,
      buffer,
      mimeType,
      imageUrl,
      file.name,
      {
        appointmentId: parsed.data.appointmentId,
        doctorId: parsed.data.doctorId,
        autoApply: parsed.data.autoApply,
      }
    );

    return NextResponse.json({
      success: true,
      data: result.prescription,
      medicines: result.medicines,
      dailyRoutine: result.dailyRoutine,
      message: parsed.data.autoApply
        ? "Prescription processed and medicines/reminders created"
        : "Prescription scanned — review before applying",
    });
  } catch (error) {
    console.error("Admin prescription upload error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Upload failed",
        medicines: [],
      },
      { status: 422 }
    );
  }
}
