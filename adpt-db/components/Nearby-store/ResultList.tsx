"use client";

import { Place } from "./types";
import { useTheme } from "@/context/ThemeContext";
import { MapPin, Phone, Hash, Layers } from "lucide-react";
import {
  formatDistance,
  getCategoryText,
  getPlaceAddress,
  getPlaceLat,
  getPlaceLon
} from '../../lib/normalize';

export default function ResultsList({ places }: { places: Place[] }) {
  const { currentTheme } = useTheme();

  return (
    <div className="space-y-4 font-sans">
      {places.map((place, index) => {
        const lat = getPlaceLat(place);
        const lon = getPlaceLon(place);
        const categories = getCategoryText(place);

        return (
          <div
            key={place.fsq_id ?? `${place.name}-${index}`}
            className="group relative rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] border"
            style={{
              backgroundColor: `${currentTheme.background}80`,
              borderColor: currentTheme.border,
            }}
          >
            {/* Index Badge */}
            <div 
              className="absolute -top-2 -left-2 w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black italic shadow-lg"
              style={{ 
                backgroundColor: currentTheme.primary, 
                color: '#ffffff',
                transform: 'rotate(-10deg)'
              }}
            >
              #{index + 1}
            </div>

            {/* Header: Name & Distance */}
            <div className="flex justify-between items-start mb-4">
              <h3 
                className="text-lg font-black uppercase italic tracking-tighter leading-tight pr-4"
                style={{ color: currentTheme.text }}
              >
                {place.name ?? "Unknown"}
              </h3>
              <div 
                className="px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest whitespace-nowrap"
                style={{ 
                  backgroundColor: `${currentTheme.primary}20`, 
                  color: currentTheme.primary 
                }}
              >
                {formatDistance(place.distance)}
              </div>
            </div>

            {/* Body: Data Grid */}
            <div className="grid grid-cols-1 gap-3 text-[11px]">
              
              {/* Address */}
              <div className="flex items-start gap-2">
                <MapPin className="w-3 h-3 shrink-0 mt-0.5 opacity-50" style={{ color: currentTheme.text }} />
                <span className="opacity-70 leading-relaxed" style={{ color: currentTheme.text }}>
                  {getPlaceAddress(place)}
                </span>
              </div>

              {/* Categories */}
              {categories && (
                <div className="flex items-center gap-2">
                  <Layers className="w-3 h-3 shrink-0 opacity-50" style={{ color: currentTheme.text }} />
                  <span className="font-bold uppercase tracking-tighter" style={{ color: currentTheme.primary }}>
                    {categories}
                  </span>
                </div>
              )}

              {/* Coordinates & Tel Row */}
              <div className="flex flex-wrap gap-4 pt-2 border-t mt-1" style={{ borderColor: `${currentTheme.border}50` }}>
                {lat !== null && (
                  <div className="flex items-center gap-1.5">
                    <Hash className="w-3 h-3 opacity-30" style={{ color: currentTheme.text }} />
                    <span className="font-mono opacity-50" style={{ color: currentTheme.text }}>
                      {lat.toFixed(4)}, {lon?.toFixed(4)}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3 h-3 opacity-30" style={{ color: currentTheme.text }} />
                  <span className="font-bold tracking-tight" style={{ color: currentTheme.text }}>
                    {place.tel ?? "NO PHONE"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}