import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";

/** Stable models — older 1.5/2.0 IDs were shut down June 2026 */
export const GEMINI_MODEL_FALLBACKS = [
  process.env.GEMINI_MODEL,
  "gemini-2.5-flash",
  "gemini-3.5-flash",
  "gemini-2.5-flash-lite",
].filter((m): m is string => Boolean(m));

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is required. Add it to .env.local");
  }
  return new GoogleGenerativeAI(apiKey);
}

function isQuotaError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return msg.includes("429") || msg.includes("quota") || msg.includes("Too Many Requests");
}

function isModelUnavailableError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes("404") ||
    msg.includes("not found") ||
    msg.includes("not supported") ||
    (msg.includes("limit: 0") && msg.includes("free_tier"))
  );
}

function parseRetryDelayMs(error: unknown): number {
  const msg = error instanceof Error ? error.message : String(error);
  const match = msg.match(/retry in ([\d.]+)s/i);
  if (match) {
    return Math.ceil(parseFloat(match[1]) * 1000) + 500;
  }
  return 20_000;
}

export function formatGeminiError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);

  if (isQuotaError(error)) {
    return "Gemini API quota exceeded. Wait 1–2 minutes and try again, or enable billing at https://aistudio.google.com";
  }

  if (msg.includes("API key not valid") || msg.includes("API_KEY_INVALID")) {
    return "Invalid Gemini API key. Get a key from https://aistudio.google.com/apikey (starts with AIzaSy...)";
  }

  return msg.length > 200 ? `${msg.slice(0, 200)}...` : msg;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getModel(modelName: string, jsonMode = false): GenerativeModel {
  return getGenAI().getGenerativeModel({
    model: modelName,
    ...(jsonMode ? { generationConfig: { responseMimeType: "application/json" } } : {}),
  });
}

export async function generateGeminiContent(
  parts: Parameters<GenerativeModel["generateContent"]>[0],
  options?: { jsonMode?: boolean }
): Promise<string> {
  const models = [...new Set(GEMINI_MODEL_FALLBACKS)];
  let lastError: unknown;

  for (const modelName of models) {
    try {
      const model = getModel(modelName, options?.jsonMode);
      const result = await model.generateContent(parts);
      const text = result.response.text()?.trim();

      if (!text) {
        throw new Error("Gemini returned empty response");
      }

      return text;
    } catch (error) {
      lastError = error;

      if (isQuotaError(error)) {
        const delay = parseRetryDelayMs(error);
        await sleep(Math.min(delay, 30_000));
        try {
          const model = getModel(modelName, options?.jsonMode);
          const result = await model.generateContent(parts);
          const text = result.response.text()?.trim();
          if (text) return text;
        } catch (retryError) {
          lastError = retryError;
        }
      }

      if (isModelUnavailableError(error) || isQuotaError(error)) {
        continue;
      }

      throw error;
    }
  }

  throw new Error(formatGeminiError(lastError));
}
