import Prescription from "@/models/Prescription";
import User from "@/models/User";
import { mergeDailyRoutine } from "@/lib/daily-routine";
import { extractTextFromImage } from "@/services/ocr.service";
import { parseMedicinesFromImage, parseMedicinesFromText } from "@/services/gemini-parser.service";
import { enrichMedicineWithSchedule } from "@/services/reminder-schedule.service";
import { bulkCreateMedicinesAndReminders } from "@/services/medicine-bulk.service";
import type { ExtractedMedicine } from "@/validations/extracted-medicine";

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

export async function processHospitalPrescriptionUpload(
  userId: string,
  buffer: Buffer,
  mimeType: string,
  imageUrl: string,
  options?: { appointmentId?: string; doctorId?: string; autoApply?: boolean }
) {
  const prescription = await Prescription.create({
    userId,
    appointmentId: options?.appointmentId,
    doctorId: options?.doctorId,
    imageUrl,
    fileName: `prescription-${Date.now()}.jpg`,
    ocrStatus: "processing",
    uploadedAt: new Date(),
  });

  try {
    const [extractResult, user] = await Promise.all([
      extractMedicines(buffer, mimeType),
      User.findById(userId).select("dailyRoutine"),
    ]);

    const { medicines, extractedText, ocrProvider } = extractResult;
    const routine = mergeDailyRoutine(user?.dailyRoutine ?? undefined);
    const scheduledMedicines = medicines.map((medicine) =>
      enrichMedicineWithSchedule(medicine, routine)
    );

    prescription.extractedText = extractedText;
    prescription.extractedMedicines = scheduledMedicines;
    prescription.ocrStatus = "completed";
    prescription.ocrProvider = ocrProvider;
    await prescription.save();

    if (options?.autoApply && scheduledMedicines.length > 0) {
      await bulkCreateMedicinesAndReminders(userId, scheduledMedicines, {
        prescriptionId: prescription._id.toString(),
        dailyRoutine: routine,
      });
    }

    return { prescription, medicines: scheduledMedicines };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Processing failed";
    prescription.ocrStatus = "failed";
    prescription.ocrError = errorMessage;
    await prescription.save();
    throw new Error(errorMessage);
  }
}
