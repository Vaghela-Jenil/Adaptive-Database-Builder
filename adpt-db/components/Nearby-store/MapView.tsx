"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from "react-leaflet";
import { Place } from "./types";
import {
  getCategoryText,
  getPlaceAddress,
  getPlaceLat,
  getPlaceLon
} from '@/lib/normalize';

import "leaflet/dist/leaflet.css";

// Forces Leaflet to recalculate its size so it doesn't appear as a gray box
function InvalidateSize({ resultsCount }: { resultsCount: number }) {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 400); // Increased delay to ensure animations finish
  }, [map, resultsCount]); // Triggers whenever data changes
  return null;
}

const categoryRules: Array<[string[], string]> = [
  [["pharmacy", "drugstore", "medical center", "maternity clinic"], "#e63946"],
  [["hospital", "clinic", "medical", "doctor", "dentist"], "#3a86ff"],
  [["restaurant", "food", "diner"], "#fb5607"],
  [["cafe", "coffee", "tea", "juice bar", "caf"], "#ffbe0b"],
  [["bar", "pub", "brewery", "nightlife"], "#ffd166"],
  [["retail", "shop", "shopping", "store", "mall", "boutique", "women"], "#2a9d8f"],
  [["supermarket", "grocery", "market"], "#06d6a0"],
  [["hotel", "lodging"], "#4361ee"],
  [["bank", "atm", "finance"], "#4cc9f0"],
  [["park", "garden"], "#2b9348"],
  [["school", "university", "college", "education", "medical school"], "#8d99ae"],
  [["gas", "fuel", "petrol", "petroleum"], "#6c757d"]
];

function getMarkerColor(categoryText: string) {
  const lowered = categoryText.toLowerCase();
  for (const [keywords, color] of categoryRules) {
    if (keywords.some((keyword) => lowered.includes(keyword))) return color;
  }
  return "#8c8c8c";
}

export default function MapView({
  places,
  center
}: {
  places: Place[];
  center: { lat: number; lon: number };
}) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <div className="h-full w-full relative min-h-100">
      <MapContainer
        key={`${center.lat}-${center.lon}-${places.length}`}
        center={[center.lat, center.lon]}
        zoom={14}
        scrollWheelZoom
        className="map"
        style={{ 
          height: "100%", 
          width: "100%", 
          position: "absolute", 
          inset: 0,
          zIndex: 1 // Essential to prevent sidebar overlap
        }}
      >
        <InvalidateSize resultsCount={places.length} />
        
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">Carto</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {places.map((place, index) => {
          const lat = getPlaceLat(place);
          const lon = getPlaceLon(place);
          if (lat === null || lon === null) return null;

          const color = getMarkerColor(getCategoryText(place));

          return (
            <CircleMarker
              key={place.fsq_id ?? index}
              center={[lat, lon]}
              radius={10}
              pathOptions={{ 
                color: '#ffffff', 
                fillColor: color, 
                fillOpacity: 1, 
                weight: 3 
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                <div className="p-1 font-sans">
                  <span className="font-black italic uppercase text-[10px] tracking-tighter">
                    {place.name}
                  </span>
                </div>
              </Tooltip>
              
              <Popup>
                <div className="p-2 font-sans space-y-1">
                  <p className="font-black italic uppercase text-sm border-b pb-1" style={{ color }}>
                    {place.name}
                  </p>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">
                    {getPlaceAddress(place)}
                  </p>
                  <div className="flex justify-between items-center pt-2">
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-[9px] font-bold">
                      {place.distance}M AWAY
                    </span>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}

