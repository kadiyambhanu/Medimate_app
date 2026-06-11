import { successResponse, errorResponse } from "@/lib/api-helpers";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q");
  if (!q?.trim()) {
    return errorResponse("Search query is required");
  }

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1`,
    {
      headers: { "User-Agent": "MediMate/1.0 (hospital location picker)" },
    }
  );

  if (!res.ok) {
    return errorResponse("Location search failed", res.status);
  }

  const data = await res.json();
  return successResponse(data);
}
