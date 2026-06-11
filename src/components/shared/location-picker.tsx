"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Loader2, MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { reverseGeocode, searchLocation } from "@/lib/geocoding";
import type { LatLngTuple } from "leaflet";

const LocationPickerMap = dynamic(() => import("@/components/map/location-picker-map"), {
  ssr: false,
  loading: () => <div className="h-full min-h-72 w-full rounded-lg border bg-muted animate-pulse" />,
});

export interface LocationData {
  address: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

interface LocationPickerProps {
  value: LocationData;
  onChange: (value: LocationData) => void;
  mapHeight?: string;
}

const DEFAULT_CENTER: LatLngTuple = [20.5937, 78.9629];

export function LocationPicker({ value, onChange, mapHeight = "208px" }: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  const hasCoords = value.latitude != null && value.longitude != null;
  const center: LatLngTuple = hasCoords ? [value.latitude!, value.longitude!] : DEFAULT_CENTER;
  const position: LatLngTuple | null = hasCoords ? [value.latitude!, value.longitude!] : null;

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const results = await searchLocation(searchQuery.trim());
      if (results.length === 0) return;

      const location = results[0];
      onChange({
        address: location.address,
        city: location.city ?? "",
        state: location.state ?? "",
        country: location.country ?? "",
        latitude: location.latitude,
        longitude: location.longitude,
      });
    } finally {
      setSearching(false);
    }
  };

  const handlePositionChange = async (lat: number, lng: number) => {
    setGeocoding(true);
    try {
      const location = await reverseGeocode(lat, lng);
      onChange({
        address: location.address,
        city: location.city ?? value.city ?? "",
        state: location.state ?? value.state ?? "",
        country: location.country ?? value.country ?? "",
        latitude: lat,
        longitude: lng,
      });
    } catch {
      onChange({
        ...value,
        latitude: lat,
        longitude: lng,
      });
    } finally {
      setGeocoding(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="location-search">Search Location</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="location-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hospital address, city, or landmark..."
              className="pl-9"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleSearch();
                }
              }}
            />
          </div>
          <Button type="button" onClick={() => void handleSearch()} disabled={searching}>
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-muted/30">
        <LocationPickerMap
          center={center}
          position={position}
          onPositionChange={(lat, lng) => void handlePositionChange(lat, lng)}
          height={mapHeight}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <MapPin className="h-3.5 w-3.5" />
        <span>Click the map or drag the pin to fine-tune the location</span>
        {(searching || geocoding) && (
          <span className="inline-flex items-center gap-1 text-primary">
            <Loader2 className="h-3 w-3 animate-spin" />
            Updating...
          </span>
        )}
      </div>

      {hasCoords && (
        <div className="rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Pinned: </span>
          {value.latitude!.toFixed(6)}, {value.longitude!.toFixed(6)}
        </div>
      )}
    </div>
  );
}
