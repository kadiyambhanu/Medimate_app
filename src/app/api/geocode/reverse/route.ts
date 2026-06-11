import { successResponse, errorResponse } from "@/lib/api-helpers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return errorResponse("Latitude and longitude are required");
  }

  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&format=json&addressdetails=1`,
    {
      headers: { "User-Agent": "MediMate/1.0 (hospital location picker)" },
    }
  );

  if (!res.ok) {
    return errorResponse("Reverse geocoding failed", res.status);
  }

  const data = await res.json();
  return successResponse(data);
}
