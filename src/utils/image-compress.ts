import sharp from "sharp";

const MAX_WIDTH = 1200;
const JPEG_QUALITY = 82;

/** Compress prescription images before OCR — smaller payload = faster Gemini response */
export async function compressForOcr(
  buffer: Buffer,
  mimeType: string
): Promise<{ buffer: Buffer; mimeType: string }> {
  if (!mimeType.startsWith("image/")) {
    return { buffer, mimeType };
  }

  try {
    const compressed = await sharp(buffer)
      .rotate()
      .resize(MAX_WIDTH, MAX_WIDTH, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toBuffer();

    if (compressed.length < buffer.length) {
      return { buffer: compressed, mimeType: "image/jpeg" };
    }
  } catch {
    // Use original if compression fails
  }

  return { buffer, mimeType };
}
