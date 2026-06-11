import { GoogleGenAI } from "@google/genai";

/** Stable models — older 1.5/2.0 IDs were shut down June 2026 */
export const GEMINI_MODEL_FALLBACKS = [
  process.env.GEMINI_MODEL,
  "gemini-2.5-flash",
  "gemini-3.5-flash",
  "gemini-2.5-flash-lite",
].filter((m): m is string => Boolean(m));

export type GeminiContentPart =
  | string
  | { inlineData: { data: string; mimeType: string } };

function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is required. Add it to .env.local");
  }

  if (apiKey.startsWith("ya29.")) {
    throw new Error(
      "GEMINI_API_KEY looks like a short-lived OAuth token. Use an API key from https://aistudio.google.com/apikey instead."
    );
  }

  return apiKey;
}

let genAiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!genAiClient) {
    genAiClient = new GoogleGenAI({ apiKey: getApiKey() });
  }
  return genAiClient;
}

function toContents(parts: GeminiContentPart | GeminiContentPart[]) {
  const list = Array.isArray(parts) ? parts : [parts];
  return list.map((part) => {
    if (typeof part === "string") {
      return part;
    }
    return { inlineData: part.inlineData };
  });
}

function isQuotaError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return msg.includes("429") || msg.includes("quota") || msg.includes("Too Many Requests");
}

function isModelUnavailableError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes("404") ||
    msg.includes("503") ||
    msg.includes("UNAVAILABLE") ||
    msg.includes("high demand") ||
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

  if (
    msg.includes("401") ||
    msg.includes("API key not valid") ||
    msg.includes("API_KEY_INVALID") ||
    msg.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED") ||
    msg.includes("invalid authentication credentials")
  ) {
    return "Invalid Gemini API key. Create or verify your key at https://aistudio.google.com/apikey";
  }

  return msg.length > 200 ? `${msg.slice(0, 200)}...` : msg;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateGeminiContent(
  parts: GeminiContentPart | GeminiContentPart[],
  options?: { jsonMode?: boolean }
): Promise<string> {
  const models = [...new Set(GEMINI_MODEL_FALLBACKS)];
  const ai = getGenAI();
  const contents = toContents(parts);
  let lastError: unknown;

  for (const modelName of models) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        ...(options?.jsonMode
          ? { config: { responseMimeType: "application/json" } }
          : {}),
      });

      const text = response.text?.trim();
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
          const response = await ai.models.generateContent({
            model: modelName,
            contents,
            ...(options?.jsonMode
              ? { config: { responseMimeType: "application/json" } }
              : {}),
          });
          const text = response.text?.trim();
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
