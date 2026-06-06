import Tesseract from "tesseract.js";
import { generateGeminiContent } from "@/services/gemini.client";

export type OcrProvider = "google-vision" | "tesseract" | "gemini";

export interface OcrResult {
  text: string;
  provider: OcrProvider;
}

async function extractWithGoogleVision(buffer: Buffer): Promise<string> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) {
    throw new Error("Google Vision API key not configured");
  }

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: buffer.toString("base64") },
            features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Google Vision API error: ${response.status} ${errorBody}`);
  }

  const data = await response.json();
  const annotation = data.responses?.[0]?.fullTextAnnotation;
  const text = annotation?.text || data.responses?.[0]?.textAnnotations?.[0]?.description;

  if (!text?.trim()) {
    throw new Error("Google Vision returned no text");
  }

  return text.trim();
}

async function extractWithTesseract(buffer: Buffer): Promise<string> {
  const { data } = await Tesseract.recognize(buffer, "eng", {
    logger: () => {},
  });

  if (!data.text?.trim()) {
    throw new Error("Tesseract returned no text");
  }

  return data.text.trim();
}

async function extractWithGemini(buffer: Buffer, mimeType: string): Promise<string> {
  return generateGeminiContent([
    { inlineData: { data: buffer.toString("base64"), mimeType } },
    "Extract all text from this prescription image exactly as written. Return only the raw text.",
  ]);
}

export async function extractTextFromImage(
  buffer: Buffer,
  mimeType: string,
  options?: { skipTesseract?: boolean }
): Promise<OcrResult> {
  const errors: string[] = [];

  if (process.env.GOOGLE_VISION_API_KEY) {
    try {
      const text = await extractWithGoogleVision(buffer);
      return { text, provider: "google-vision" };
    } catch (err) {
      errors.push(`Google Vision: ${err instanceof Error ? err.message : "failed"}`);
    }
  }

  if (!options?.skipTesseract && mimeType.startsWith("image/")) {
    try {
      const text = await extractWithTesseract(buffer);
      return { text, provider: "tesseract" };
    } catch (err) {
      errors.push(`Tesseract: ${err instanceof Error ? err.message : "failed"}`);
    }
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      const text = await extractWithGemini(buffer, mimeType);
      return { text, provider: "gemini" };
    } catch (err) {
      errors.push(`Gemini OCR: ${err instanceof Error ? err.message : "failed"}`);
    }
  }

  throw new Error(
    errors.length > 0
      ? `OCR failed: ${errors.join("; ")}`
      : "No OCR provider configured. Set GOOGLE_VISION_API_KEY or GEMINI_API_KEY in .env.local"
  );
}
