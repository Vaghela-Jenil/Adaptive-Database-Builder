"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from "react-leaflet";
import { Place } from "./types";
import {
  getCategoryText,
  getPlaceAddress,
  getPlaceLat,
  getPlaceLon
} from '@/lib/normalize';

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
    if (keywords.some((keyword) => lowered.includes(keyword))) {
      return color;
    }
  }
  return "#577590";
}

export default function MapView({
  places,
  center
}: {
  places: Place[];
  center: { lat: number; lon: number };
}) {
  const [isClient, setIsClient] = useState(false);
  const [instanceKey, setInstanceKey] = useState(0);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    setInstanceKey((prev) => prev + 1);
  }, [center.lat, center.lon, places.length]);

  if (!isClient) return null;

  return (
    <MapContainer
      key={instanceKey}
      center={[center.lat, center.lon]}
      zoom={13}
      scrollWheelZoom
      className="map"
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {places.map((place, index) => {
        const lat = getPlaceLat(place);
        const lon = getPlaceLon(place);
        if (lat === null || lon === null) return null;
        const categories = getCategoryText(place);
        const color = getMarkerColor(categories);
        return (
          <CircleMarker
            key={place.fsq_id ?? `${place.name}-${index}`}
            center={[lat, lon]}
            radius={9}
            pathOptions={{ color, fillColor: color, fillOpacity: 0.85 }}
          >
            <Tooltip direction="top" offset={[0, -6]} opacity={1}>
              <div className="map-tooltip">
                <strong>{place.name ?? "Unknown"}</strong>
                <div>{place.distance ?? 0} m away</div>
                <div>{place.tel ?? "N/A"}</div>
              </div>
            </Tooltip>
            <Popup>
              <div className="map-popup">
                <strong>
                  {index + 1}. {place.name ?? "Unknown"}
                </strong>
                <div>{getPlaceAddress(place)}</div>
                <div>{place.distance ?? 0} m away</div>
                <div>{place.tel ?? "N/A"}</div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}