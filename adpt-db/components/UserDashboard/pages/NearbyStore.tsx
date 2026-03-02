"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import { Loader2, Info, Compass } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

import ResultsList from "@/components/Nearby-store/ResultList";
import ExportButtons from "@/components/Nearby-store/ExportButton";
import { Place } from "@/components/Nearby-store/types";
import { Button } from "@/components/ui/button";

// Load Map only on client with a matching fancy placeholder
const MapView = dynamic(() => import("../../../components/Nearby-store/MapView"), {
  ssr: false,
  loading: () => (
    <div className="h-145 w-full bg-slate-200/50 flex flex-col items-center justify-center animate-pulse rounded-[2rem]">
      <Compass className="w-12 h-12 mb-4 opacity-20 animate-spin" />
      <span className="text-[10px] font-black uppercase tracking-widest opacity-20">Mapping Coordinates...</span>
    </div>
  )
});

const SORT_OPTIONS = ["RELEVANCE", "RATING", "DISTANCE", "POPULARITY"] as const;
const OPEN_NOW_OPTIONS = ["", "true", "false"] as const;
type SortOption = (typeof SORT_OPTIONS)[number];
type OpenNowOption = (typeof OPEN_NOW_OPTIONS)[number];

type SearchState = {
  query: string;
  latitude: number;
  longitude: number;
  radius: number;
  limit: number;
  sort: SortOption;
  open_now: OpenNowOption;
};

export default function NearByStorePage() {
  const { currentTheme } = useTheme();

  const [query, setQuery] = useState("pharmacy");
  const [latitude, setLatitude] = useState(23.0225);
  const [longitude, setLongitude] = useState(72.5714);
  const [radius, setRadius] = useState(1000);
  const [limit, setLimit] = useState(10);
  const [sort, setSort] = useState<SortOption>("RELEVANCE");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Place[] | null>(null);
  const [lastSearch, setLastSearch] = useState<SearchState | null>(null);
  const [open_now, setOpenNow] = useState<OpenNowOption>("");

  const handleLocationClick = async () => {
    setLoading(true);
    try {
      await getBrowserLocation();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        query,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        radius: radius.toString(),
        limit: limit.toString(),
        sort,
      });
      if (open_now !== "") {
        params.set("open_now", open_now);
      }

      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "API request failed");

      setResults(data?.results?.length ? (data.results as Place[]) : []);
      setLastSearch({ query, latitude, longitude, radius, limit, sort, open_now });
    } catch (err: any) {
      setError(err?.message ?? "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  const getBrowserLocation = async () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          setLatitude(lat);
          setLongitude(lng);
          resolve({ latitude: lat, longitude: lng });
        },
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              reject(console.error("User denied the request for Geolocation."));
              break;
            case error.POSITION_UNAVAILABLE:
              reject(console.error("Location information is unavailable."));
              break;
            default:
              reject(console.error("An unknown error occurred."));
              break;
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    });
  };

  const hasResults = Boolean(results && results.length > 0);
  const hasSearched = Boolean(lastSearch);

  const fileBase = useMemo(() => {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    return `foursquare_${lastSearch?.query ?? "search"}_${stamp}`;
  }, [lastSearch]);

  return (
    <div className="max-w-400 mx-auto px-8 py-12 space-y-12 font-sans overflow-x-hidden">

      {/* Header */}
      <div className="space-y-1 flex justify-between">
       <div>
         <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-7xl font-black tracking-tighter uppercase italic leading-none"
          style={{ color: currentTheme.text }}
        >
          Store <span style={{ color: currentTheme.primary }}>Finder</span>
        </motion.h1>
       </div>
        <Button
        className="mt-6"
          onClick={handleLocationClick}
          disabled={loading}
          style={{ backgroundColor: currentTheme.primary }}
        >
          {loading ? "Locating..." : "Find your coordinates"}
        </Button>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">

        {/* Sidebar */}
        <motion.aside
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-4 xl:col-span-3 rounded-[2.5rem] p-8 space-y-6 h-fit relative z-10"
          style={{
            background: `${currentTheme.surface}B3`,
            border: `1px solid ${currentTheme.border}`,
            backdropFilter: 'blur(16px)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)'
          }}
        >
          <div className="space-y-1 mb-4">
            <h2 className="text-[10px] font-black uppercase tracking-widest" style={{ color: currentTheme.primary }}>
              Engine Configuration
            </h2>
            <p className="text-xl font-bold italic" style={{ color: currentTheme.text }}>Parameters</p>
          </div>

          {[
            { label: "Search Query", value: query, setter: setQuery, type: "text" },
            { label: "Radius (meters)", value: radius, setter: (v: any) => setRadius(Number(v)), type: "number" },
            { label: "Result Limit", value: limit, setter: (v: any) => setLimit(Number(v)), type: "number" },
            {
              label: "Open Now",
              value: open_now,
              setter: setOpenNow,
              type: "select",
              options: [
                { label: 'Any', value: '' },
                { label: 'Yes', value: 'true' },
                { label: 'No', value: 'false' }
              ]
            }
          ].map((field, i) => (
            <div key={i} className="space-y-1.5 group">
              <label
                className="text-[10px] font-bold uppercase opacity-50 ml-1"
                style={{ color: currentTheme.textSecondary }}
              >
                {field.label}
              </label>

              {field.type === "select" ? (
                <select
                  value={field.value}
                  onChange={(e) => field.setter(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl text-sm outline-none border transition-all appearance-none cursor-pointer"
                  style={{
                    backgroundColor: currentTheme.background,
                    borderColor: currentTheme.border,
                    color: currentTheme.text,
                  }}
                >
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  value={field.value}
                  onChange={(e) => field.setter(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl text-sm outline-none border transition-all focus:ring-2"
                  style={{
                    backgroundColor: currentTheme.background,
                    borderColor: currentTheme.border,
                    color: currentTheme.text,
                    // @ts-ignore
                    '--tw-ring-color': currentTheme.primary
                  }}
                />
              )}
            </div>
          ))}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase opacity-50 ml-1" style={{ color: currentTheme.textSecondary }}>Lat</label>
              <input type="number" value={latitude} onChange={(e) => setLatitude(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl text-xs outline-none border"
                style={{ backgroundColor: currentTheme.background, borderColor: currentTheme.border, color: currentTheme.text }} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase opacity-50 ml-1" style={{ color: currentTheme.textSecondary }}>Long</label>
              <input type="number" value={longitude} onChange={(e) => setLongitude(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl text-xs outline-none border"
                style={{ backgroundColor: currentTheme.background, borderColor: currentTheme.border, color: currentTheme.text }} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase opacity-50 ml-1" style={{ color: currentTheme.textSecondary }}>Sort Protocol</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="w-full px-3 py-3 rounded-2xl text-sm outline-none appearance-none border"
              style={{ backgroundColor: currentTheme.background, borderColor: currentTheme.border, color: currentTheme.text }}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <button
            onClick={onSearch}
            disabled={loading}
            className="w-full py-4 rounded-[1.5rem] text-white font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-xl"
            style={{
              backgroundColor: currentTheme.primary,
              boxShadow: `0 10px 20px -5px ${currentTheme.primary}60`
            }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Initiate Search"}
          </button>
        </motion.aside>

        {/* Dashboard Area */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-8">
          {!hasSearched && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="space-y-6"
            >
              {/* Getting Started Guide */}
              <div
                className="rounded-[2rem] p-8 border-2"
                style={{ borderColor: `${currentTheme.primary}40`, backgroundColor: `${currentTheme.primary}08` }}
              >
                <div className="space-y-6">
                  {/* Header */}
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black uppercase italic tracking-tight" style={{ color: currentTheme.text }}>
                      How to Find <span style={{ color: currentTheme.primary }}>Nearby Stores</span>
                    </h2>
                    <p className="text-sm opacity-70" style={{ color: currentTheme.textSecondary }}>
                      Follow these simple steps to discover stores around your location
                    </p>
                  </div>

                  {/* Steps Guide */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Step 1 */}
                    <div className="flex gap-4 p-4 rounded-xl" style={{ backgroundColor: `${currentTheme.background}80` }}>
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 font-black text-white"
                        style={{ backgroundColor: currentTheme.primary }}
                      >
                        1
                      </div>
                      <div>
                        <p className="font-bold text-sm mb-1" style={{ color: currentTheme.text }}>
                          Enter Store Name
                        </p>
                        <p className="text-[11px] opacity-70" style={{ color: currentTheme.textSecondary }}>
                          Type the store type you're looking for (e.g., "pharmacy", "cafe", "hotel", "restaurant")
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex gap-4 p-4 rounded-xl" style={{ backgroundColor: `${currentTheme.background}80` }}>
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 font-black text-white"
                        style={{ backgroundColor: currentTheme.primary }}
                      >
                        2
                      </div>
                      <div>
                        <p className="font-bold text-sm mb-1" style={{ color: currentTheme.text }}>
                          Set Your Location
                        </p>
                        <p className="text-[11px] opacity-70" style={{ color: currentTheme.textSecondary }}>
                          Use "Find your coordinates" to auto-detect, or enter latitude & longitude manually
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex gap-4 p-4 rounded-xl" style={{ backgroundColor: `${currentTheme.background}80` }}>
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 font-black text-white"
                        style={{ backgroundColor: currentTheme.primary }}
                      >
                        3
                      </div>
                      <div>
                        <p className="font-bold text-sm mb-1" style={{ color: currentTheme.text }}>
                          Adjust Search Parameters
                        </p>
                        <p className="text-[11px] opacity-70" style={{ color: currentTheme.textSecondary }}>
                          Fine-tune radius (meters), result limit, sort order, and filter by "Open Now"
                        </p>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex gap-4 p-4 rounded-xl" style={{ backgroundColor: `${currentTheme.background}80` }}>
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 font-black text-white"
                        style={{ backgroundColor: currentTheme.primary }}
                      >
                        4
                      </div>
                      <div>
                        <p className="font-bold text-sm mb-1" style={{ color: currentTheme.text }}>
                          Click "Initiate Search"
                        </p>
                        <p className="text-[11px] opacity-70" style={{ color: currentTheme.textSecondary }}>
                          See results on the map and list. Export data as CSV, XLSX, or JSON
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Store Categories Guide */}
              <div
                className="rounded-[2rem] p-8 border"
                style={{ borderColor: currentTheme.border, backgroundColor: `${currentTheme.surface}80` }}
              >
                <div className="space-y-4 mb-2">
                  <h3 className="text-lg font-black uppercase italic tracking-tight" style={{ color: currentTheme.text }}>
                    Store <span style={{ color: currentTheme.primary }}>Categories</span>
                  </h3>
                  <p className="text-xs opacity-70" style={{ color: currentTheme.textSecondary }}>
                    Each marker color represents a different store category:
                  </p>
                </div>

                {/* Categories Grid */}
                <div className="grid md:grid-cols-3 gap-3">
                  {[
                    { name: "Pharmacy", color: "#e63946", examples: "Drugstore, Medical Center" },
                    { name: "Hospital", color: "#3a86ff", examples: "Clinic, Doctor, Dentist" },
                    { name: "Restaurant", color: "#fb5607", examples: "Food, Diner" },
                    { name: "Cafe", color: "#ffbe0b", examples: "Coffee, Tea, Juice Bar" },
                    { name: "Bar/Pub", color: "#ffd166", examples: "Brewery, Nightlife" },
                    { name: "Retail", color: "#2a9d8f", examples: "Shop, Mall, Boutique" },
                    { name: "Supermarket", color: "#06d6a0", examples: "Grocery, Market" },
                    { name: "Hotel", color: "#4361ee", examples: "Lodging, Accommodation" },
                    { name: "Bank", color: "#4cc9f0", examples: "ATM, Finance" },
                    { name: "Park", color: "#2b9348", examples: "Garden, Recreation" },
                    { name: "School", color: "#8d99ae", examples: "University, College, Education" },
                    { name: "Gas Station", color: "#6c757d", examples: "Fuel, Petrol" },
                  ].map((category, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-xl border"
                      style={{ borderColor: category.color, backgroundColor: `${category.color}15` }}
                    >
                      <div
                        className="w-4 h-4 rounded-full shrink-0 border-2 border-white"
                        style={{ backgroundColor: category.color }}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold" style={{ color: currentTheme.text }}>
                          {category.name}
                        </p>
                        <p className="text-[10px] opacity-60 truncate" style={{ color: currentTheme.textSecondary }}>
                          {category.examples}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Tips */}
              <div
                className="rounded-[2rem] p-6 border-l-4 flex gap-4"
                style={{ borderColor: currentTheme.primary, backgroundColor: `${currentTheme.primary}10` }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: currentTheme.primary }}
                >
                  <span className="text-white font-black text-lg">💡</span>
                </div>
                <div className="space-y-2 flex-1">
                  <p className="font-bold text-sm" style={{ color: currentTheme.text }}>
                    Pro Tips
                  </p>
                  <ul className="text-xs space-y-1 opacity-70" style={{ color: currentTheme.textSecondary }}>
                    <li>✓ Smaller radius = faster results & more accurate location</li>
                    <li>✓ Sort by "DISTANCE" to find the closest stores first</li>
                    <li>✓ Use "RATING" sort to find the best-reviewed places</li>
                    <li>✓ Change "Open Now" to only see currently operating stores</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

          {error && (
            <div className="p-4 rounded-2xl text-xs font-bold border border-red-500 bg-red-500/10 text-red-500 uppercase">
              {error}
            </div>
          )}

          {hasResults && (
            <div className="space-y-8">
              <div className="grid xl:grid-cols-5 gap-8">
                {/* List Container */}
                <div className="xl:col-span-2 rounded-[2.5rem] p-8 space-y-4"
                  style={{ background: `${currentTheme.surface}B3`, border: `1px solid ${currentTheme.border}` }}>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-black uppercase italic tracking-widest" style={{ color: currentTheme.text }}>
                      Nearby <span style={{ color: currentTheme.primary }}>Targets</span>
                    </h2>
                    <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-white/10" style={{ color: currentTheme.text }}>
                      {results?.length} items
                    </span>
                  </div>
                  <div className="h-125 overflow-y-auto pr-2">
                    <ResultsList places={results ?? []} />
                  </div>
                </div>

                {/* Map Container - Ensuring high visibility */}
                <div className="xl:col-span-3 rounded-[2.5rem] p-2"
                  style={{ background: `${currentTheme.surface}B3`, border: `1px solid ${currentTheme.border}` }}>
                  <div className="rounded-[2rem] overflow-hidden h-145 w-full relative border bg-slate-50/10" style={{ borderColor: currentTheme.border }}>
                    <MapView
                      places={results ?? []}
                      center={{
                        lat: lastSearch?.latitude ?? latitude,
                        lon: lastSearch?.longitude ?? longitude,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6"
                style={{
                  backgroundColor: `${currentTheme.primary}10`,
                  border: `1px solid ${currentTheme.primary}30`,
                  backdropFilter: 'blur(10px)'
                }}
              >
                <div>
                  <h3 className="font-black uppercase italic text-lg leading-tight" style={{ color: currentTheme.text }}>
                    Export <span style={{ color: currentTheme.primary }}>Dataset</span>
                  </h3>
                  <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest" style={{ color: currentTheme.textSecondary }}>
                    Available Formats: CSV • XLSX • JSON
                  </p>
                </div>
                <ExportButtons places={results ?? []} fileBase={fileBase} />
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}