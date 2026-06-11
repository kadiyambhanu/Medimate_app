"use client";

import dynamic from "next/dynamic";

const Map = dynamic(() => import("@/components/map/map"), {
  ssr: false,
  loading: () => <div className="h-64 w-full rounded-md border bg-muted" />,
});

interface HospitalMapProps {
  latitude: number;
  longitude: number;
  hospitalName: string;
  className?: string;
}

export function HospitalMap({ latitude, longitude, hospitalName, className }: HospitalMapProps) {
  return (
    <div className={`overflow-hidden rounded-md border ${className ?? ""}`}>
      <Map latitude={latitude} longitude={longitude} label={hospitalName} height="256px" />
    </div>
  );
}
