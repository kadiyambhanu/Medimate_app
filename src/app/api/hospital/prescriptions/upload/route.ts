import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { uploadToCloudinary, isCloudinaryEnabled } from "@/lib/cloudinary";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { ROLES } from "@/lib/constants";
import { processHospitalPrescriptionUpload } from "@/services/hospital-prescription.service";
import { compressForOcr } from "@/utils/image-compress";
import Appointment from "@/models/Appointment";

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
    if (!payload || payload.role !== ROLES.HOSPITAL || !payload.hospitalId) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const appointmentId = (formData.get("appointmentId") as string) || undefined;
    const autoApply = formData.get("autoApply") === "true";

    if (!file) {
      return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 });
    }

    if (!appointmentId) {
      return NextResponse.json({ success: false, message: "Appointment is required" }, { status: 400 });
    }

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      hospitalId: payload.hospitalId,
    });

    if (!appointment) {
      return NextResponse.json({ success: false, message: "Appointment not found" }, { status: 404 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ success: false, message: "Invalid file type" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const rawBuffer = Buffer.from(bytes);
    const { buffer, mimeType } = await compressForOcr(rawBuffer, file.type);
    const imageUrl = await persistImage(buffer, file.name);

    const result = await processHospitalPrescriptionUpload(
      appointment.userId.toString(),
      buffer,
      mimeType,
      imageUrl,
      {
        appointmentId,
        doctorId: appointment.doctorId.toString(),
        autoApply,
      }
    );

    return NextResponse.json({
      success: true,
      data: result.prescription,
      medicines: result.medicines,
      message: autoApply
        ? "Prescription processed and medicines created for patient"
        : "Prescription uploaded and processed",
    });
  } catch (error) {
    console.error("Hospital prescription upload error:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Upload failed" },
      { status: 422 }
    );
  }
}
