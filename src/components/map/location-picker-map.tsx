"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";
import { fixLeafletIcon } from "@/lib/leaflet-icon";

interface LocationPickerMapProps {
  center: LatLngTuple;
  position: LatLngTuple | null;
  onPositionChange: (lat: number, lng: number) => void;
  height?: string;
}

function RecenterMap({ center }: { center: LatLngTuple }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, positionZoom(center));
  }, [center, map]);

  return null;
}

function MapClickHandler({ onPositionChange }: { onPositionChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onPositionChange(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

function positionZoom(center: LatLngTuple) {
  return center[0] === 20.5937 && center[1] === 78.9629 ? 5 : 15;
}

export default function LocationPickerMap({
  center,
  position,
  onPositionChange,
  height = "208px",
}: LocationPickerMapProps) {
  useEffect(() => {
    fixLeafletIcon();
  }, []);

  return (
    <MapContainer
      center={center}
      zoom={positionZoom(center)}
      style={{ height, width: "100%" }}
      scrollWheelZoom
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <RecenterMap center={center} />
      <MapClickHandler onPositionChange={onPositionChange} />
      {position ? (
        <Marker
          position={position}
          draggable
          eventHandlers={{
            dragend: (event) => {
              const latlng = event.target.getLatLng();
              onPositionChange(latlng.lat, latlng.lng);
            },
          }}
        />
      ) : null}
    </MapContainer>
  );
}
