"use client";

import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps";

const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title?: string;
  onClick?: () => void;
}

export default function MapView({
  center,
  markers = [],
  zoom = 12,
  height = 360,
}: {
  center: { lat: number; lng: number };
  markers?: MapMarker[];
  zoom?: number;
  height?: number;
}) {
  if (!KEY) {
    return (
      <div
        className="rounded-2xl border border-pj-slate-200 bg-pj-slate-50 flex items-center justify-center text-pj-slate-500 text-sm"
        style={{ height }}
      >
        Map unavailable — set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable it.
      </div>
    );
  }
  return (
    <div className="rounded-2xl overflow-hidden" style={{ height }}>
      <APIProvider apiKey={KEY}>
        <Map center={center} defaultZoom={zoom} gestureHandling="greedy" disableDefaultUI style={{ width: "100%", height: "100%" }}>
          {markers.map((m) => (
            <Marker key={m.id} position={{ lat: m.lat, lng: m.lng }} title={m.title} onClick={m.onClick} />
          ))}
        </Map>
      </APIProvider>
    </div>
  );
}
