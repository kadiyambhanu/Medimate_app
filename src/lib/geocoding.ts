import api from "@/lib/api";

interface NominatimAddress {
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  state?: string;
  country?: string;
}

interface NominatimSearchResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: NominatimAddress;
}

interface NominatimReverseResult {
  display_name: string;
  address?: NominatimAddress;
}

export interface GeocodedLocation {
  address: string;
  city?: string;
  state?: string;
  country?: string;
  latitude: number;
  longitude: number;
}

function parseNominatimAddress(address?: NominatimAddress) {
  return {
    city: address?.city || address?.town || address?.village || address?.suburb,
    state: address?.state,
    country: address?.country,
  };
}

export async function searchLocation(query: string): Promise<GeocodedLocation[]> {
  const res = await api.get(`/geocode/search?q=${encodeURIComponent(query)}`);
  const results = res.data.data as NominatimSearchResult[];

  return results.map((item) => ({
    address: item.display_name,
    ...parseNominatimAddress(item.address),
    latitude: Number(item.lat),
    longitude: Number(item.lon),
  }));
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodedLocation> {
  const res = await api.get(`/geocode/reverse?lat=${lat}&lon=${lng}`);
  const data = res.data.data as NominatimReverseResult;

  return {
    address: data.display_name,
    ...parseNominatimAddress(data.address),
    latitude: lat,
    longitude: lng,
  };
}
