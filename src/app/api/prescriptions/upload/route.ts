import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { uploadToCloudinary, isCloudinaryEnabled } from "@/lib/cloudinary";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import Prescription from "@/models/Prescription";
import User from "@/models/User";
import { extractTextFromImage } from "@/services/ocr.service";
import { parseMedicinesFromImage, parseMedicinesFromText } from "@/services/gemini-parser.service";
import { enrichMedicineWithSchedule } from "@/services/reminder-schedule.service";
import { mergeDailyRoutine } from "@/lib/daily-routine";
import { compressForOcr } from "@/utils/image-compress";
import type { ExtractedMedicine } from "@/validations/extracted-medicine";

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

async function extractMedicines(
  buffer: Buffer,
  mimeType: string
): Promise<{ medicines: ExtractedMedicine[]; extractedText?: string; ocrProvider?: string }> {
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);

  if (hasGemini) {
    try {
      const medicines = await parseMedicinesFromImage(buffer, mimeType);
      return { medicines, ocrProvider: "gemini-vision" };
    } catch (visionError) {
      try {
        const ocrResult = await extractTextFromImage(buffer, mimeType, { skipTesseract: true });
        const medicines = await parseMedicinesFromText(ocrResult.text);
        return { medicines, extractedText: ocrResult.text, ocrProvider: ocrResult.provider };
      } catch {
        throw visionError instanceof Error ? visionError : new Error("Failed to scan prescription");
      }
    }
  }

  const ocrResult = await extractTextFromImage(buffer, mimeType);
  const medicines = await parseMedicinesFromText(ocrResult.text);
  return { medicines, extractedText: ocrResult.text, ocrProvider: ocrResult.provider };
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
    }

    await connectDB();
    const formData = await request.formData();
    const file = formData.get("file") as File;

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

    const prescription = await Prescription.create({
      userId: payload.userId,
      imageUrl: "/uploads/prescriptions/pending",
      fileName: file.name,
      ocrStatus: "processing",
      uploadedAt: new Date(),
    });

    try {
      const [extractResult, imageUrl, user] = await Promise.all([
        extractMedicines(buffer, mimeType),
        persistImage(buffer, file.name),
        User.findById(payload.userId).select("dailyRoutine"),
      ]);

      const { medicines, extractedText, ocrProvider } = extractResult;
      const routine = mergeDailyRoutine(user?.dailyRoutine ?? undefined);
      const scheduledMedicines = medicines.map((medicine) =>
        enrichMedicineWithSchedule(medicine, routine)
      );

      prescription.imageUrl = imageUrl;
      prescription.extractedText = extractedText;
      prescription.extractedMedicines = scheduledMedicines;
      prescription.ocrStatus = "completed";
      prescription.ocrProvider = ocrProvider;
      await prescription.save();

      return NextResponse.json({
        success: true,
        medicines: scheduledMedicines,
        dailyRoutine: routine,
        data: prescription,
        message: "Prescription scanned — review medicines and reminder times before saving",
      });
    } catch (ocrError) {
      const errorMessage = ocrError instanceof Error ? ocrError.message : "Processing failed";

      prescription.ocrStatus = "failed";
      prescription.ocrError = errorMessage;
      await prescription.save();

      return NextResponse.json(
        { success: false, message: errorMessage, data: prescription, medicines: [] },
        { status: 422 }
      );
    }
  } catch (error) {
    console.error("Prescription upload error:", error);
    return NextResponse.json(
      { success: false, message: "Upload failed", medicines: [] },
      { status: 500 }
    );
  }
}
