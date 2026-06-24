"use client";

import { useEffect, useRef, useState } from "react";
import { APIProvider, Map, Marker, useMapsLibrary } from "@vis.gl/react-google-maps";
import { inputClass } from "./ui";

const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
const HARARE = { lat: -17.8252, lng: 31.0335 };

interface Props {
  address: string;
  coords: { lat: number; lng: number } | null;
  onAddressChange: (a: string) => void;
  onCoordsChange: (c: { lat: number; lng: number } | null) => void;
}

type Prediction = { place_id: string; description: string };
type GeoResult = { geometry: { location: { lat(): number; lng(): number } }; formatted_address: string };

function Inner({ address, coords, onAddressChange, onCoordsChange }: Props) {
  const places = useMapsLibrary("places");
  const geocoding = useMapsLibrary("geocoding");
  const [query, setQuery] = useState(address);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [searchErr, setSearchErr] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const acService = useRef<any>(null);

  useEffect(() => {
    if (places) acService.current = new places.AutocompleteService();
  }, [places]);

  const onQueryChange = (v: string) => {
    setQuery(v);
    onAddressChange(v);
    setSearchErr(null);
    if (!acService.current || v.trim().length < 3) return setPredictions([]);
    acService.current.getPlacePredictions(
      { input: v, componentRestrictions: { country: "zw" } },
      (preds: Prediction[] | null, status: string) => {
        setPredictions(preds ?? []);
        // Surface why suggestions are empty (almost always: Places API not enabled on the key).
        if (status !== "OK" && status !== "ZERO_RESULTS") {
          console.warn("[places] getPlacePredictions status:", status);
          setSearchErr(
            status === "REQUEST_DENIED"
              ? "Address search is unavailable (enable the Places API for this Maps key). You can still drop a pin on the map."
              : "Couldn't load address suggestions. Drop a pin on the map instead."
          );
        }
      }
    );
  };

  const reverseGeocode = (c: { lat: number; lng: number }) => {
    if (!geocoding) return;
    new geocoding.Geocoder().geocode({ location: c }, (res: GeoResult[] | null, status: string) => {
      if (status === "OK" && res && res[0]) {
        setQuery(res[0].formatted_address);
        onAddressChange(res[0].formatted_address);
      }
    });
  };

  const selectPrediction = (p: Prediction) => {
    setQuery(p.description);
    onAddressChange(p.description);
    setPredictions([]);
    if (!geocoding) return;
    new geocoding.Geocoder().geocode({ placeId: p.place_id }, (res: GeoResult[] | null, status: string) => {
      if (status === "OK" && res && res[0]) {
        const loc = res[0].geometry.location;
        onCoordsChange({ lat: loc.lat(), lng: loc.lng() });
      }
    });
  };

  const pick = (c: { lat: number; lng: number }) => {
    onCoordsChange(c);
    reverseGeocode(c);
  };

  const useMyLocation = () => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => pick({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => undefined,
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        className={inputClass}
        placeholder="Search address or place…"
        aria-label="Search for the job address"
      />
      {predictions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-pj-slate-200 rounded-xl shadow-lg overflow-hidden">
          {predictions.map((p) => (
            <button
              key={p.place_id}
              type="button"
              onClick={() => selectPrediction(p)}
              className="block w-full text-left px-4 py-2.5 text-sm text-pj-slate-700 hover:bg-pj-blue-50 border-b border-pj-slate-100 last:border-0"
            >
              {p.description}
            </button>
          ))}
        </div>
      )}
      {searchErr && <p className="text-xs text-amber-600 mt-1">{searchErr}</p>}
      <button
        type="button"
        onClick={useMyLocation}
        className="mt-2 text-sm font-medium text-pj-blue-700 hover:underline"
      >
        Use my current location
      </button>
      <div className="mt-2 rounded-xl overflow-hidden border border-pj-slate-200">
        <Map
          center={coords ?? HARARE}
          defaultZoom={coords ? 16 : 12}
          gestureHandling="greedy"
          disableDefaultUI
          style={{ width: "100%", height: 220 }}
          onClick={(e) => {
            const ll = e.detail.latLng;
            if (ll) pick({ lat: ll.lat, lng: ll.lng });
          }}
        >
          {coords && <Marker position={coords} />}
        </Map>
      </div>
      <p className="text-xs text-pj-slate-400 mt-1">
        {coords ? "📍 Pinned. Tap the map to fine-tune the exact spot." : "Search above, or tap the map to drop a pin."}
      </p>
    </div>
  );
}

/** Web address picker (Places autocomplete + map). Falls back to a plain input without a key. */
export default function LocationPicker(props: Props) {
  if (!KEY) {
    return (
      <input
        value={props.address}
        onChange={(e) => props.onAddressChange(e.target.value)}
        className={inputClass}
        placeholder="Address / landmark"
      />
    );
  }
  return (
    <APIProvider apiKey={KEY}>
      <Inner {...props} />
    </APIProvider>
  );
}
