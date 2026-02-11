"use client";
import '../../../components/ui/style.css'
import "leaflet/dist/leaflet.css";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import ResultsList from "@/components/Nearby-store/ResultList";
import ExportButtons from "@/components/Nearby-store/ExportButton";
import { Place } from "@/components/Nearby-store/types";
import { buildExportRows } from "@/lib/normalize";

const MapView = dynamic(() => import("../../../components/Nearby-store/MapView"), { ssr: false });

const SORT_OPTIONS = ["RELEVANCE", "RATING", "DISTANCE", "POPULARITY"] as const;

type SortOption = (typeof SORT_OPTIONS)[number];

type SearchState = {
  query: string;
  latitude: number;
  longitude: number;
  radius: number;
  limit: number;
  sort: SortOption;
};

export default function NearByStorePage() {
  const [query, setQuery] = useState("pharmacy");
  const [latitude, setLatitude] = useState(23.0225);
  const [longitude, setLongitude] = useState(72.5714);
  const [radius, setRadius] = useState(1000);
  const [limit, setLimit] = useState(10);
  const [sort, setSort] = useState<SortOption>("RELEVANCE");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Place[] | null>(null);
  const [showGuide, setShowGuide] = useState(true);
  const [lastSearch, setLastSearch] = useState<SearchState | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  const rows = useMemo(() => (results ? buildExportRows(results) : []), [results]);

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
        sort
      });
      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "API request failed");
      }
      if (!data?.results?.length) {
        setResults([]);
      } else {
        setResults(data.results as Place[]);
      }
      setLastSearch({ query, latitude, longitude, radius, limit, sort });
    } catch (err: any) {
      setError(err?.message ?? "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  const hasResults = Boolean(results && results.length > 0);
  const hasSearched = Boolean(lastSearch);

  const fileBase = useMemo(() => {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    return `foursquare_${lastSearch?.query ?? "search"}_${stamp}`;
  }, [lastSearch]);

  if (showGuide) {
    return (
      <div className='app-shell'>
        <div className={`page ${darkMode ? "theme-dark" : ""}`}>
        <header className="topbar">
          <button className="theme-toggle" onClick={() => setDarkMode((prev) => !prev)}>
            {darkMode ? "Light mode" : "Dark mode"}
          </button>
        </header>
        <main className="guide-wrap">
          <section className="card glass guide">
            <h1>Welcome to Nearby Store Locator</h1>
            <p>1. Select a category</p>
            <p>2. Enter your location</p>
            <p>3. Adjust radius and limit as needed</p>
            <p>4. Click Search</p>
            <button className="btn" onClick={() => setShowGuide(false)}>
              Ok, let's start
            </button>
          </section>
        </main>
      </div>
      </div>
    );
  }

  return (
    <div className={`page ${darkMode ? "theme-dark" : ""}`}>
      <header className="topbar">
        <button className="theme-toggle" onClick={() => setDarkMode((prev) => !prev)}>
          {darkMode ? "Light mode" : "Dark mode"}
        </button>
      </header>

      <section className="shell">
        <aside className="sidebar card">
          <h2>Search Parameters</h2>
          <div className="sidebar-controls">
            <div className="control">
              <label>Search Query</label>
              <input value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="control">
              <label>Latitude</label>
              <input
                type="number"
                step="0.0001"
                value={latitude}
                onChange={(e) => setLatitude(Number(e.target.value))}
              />
            </div>
            <div className="control">
              <label>Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={longitude}
                onChange={(e) => setLongitude(Number(e.target.value))}
              />
            </div>
            <div className="control">
              <label>Sort</label>
              <select value={sort} onChange={(e) => setSort(e.target.value as SortOption)}>
                {SORT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="control">
              <label>Radius (meters)</label>
              <input
                type="number"
                min={100}
                max={10000}
                step={100}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
              />
            </div>
            <div className="control">
              <label>Limit</label>
              <input
                type="number"
                min={1}
                max={50}
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="sidebar-actions">
            <button className="btn" onClick={onSearch} disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </aside>

        <main className="main">
          {!hasSearched ? (
            <section className="card intro">
              <h1>Nearby Store Locator</h1>
              <p>Search for places near any location using the Foursquare Places API.</p>
            </section>
          ) : null}

          {error ? <div className="status error">{error}</div> : null}

          {hasResults ? (
            <div className="status success">
              Found {results?.length} places for '{lastSearch?.query}'
            </div>
          ) : null}

          {!hasResults && hasSearched ? (
            <div className="status info">
              No results found. Adjust your search parameters and try again.
            </div>
          ) : null}

          {hasResults ? (
            <section className="grid">
              <div>
                <h2>Results List</h2>
                <ResultsList places={results ?? []} />
              </div>
              <div>
                <h2>Map View</h2>
                <MapView
                  places={results ?? []}
                  center={{
                    lat: lastSearch?.latitude ?? latitude,
                    lon: lastSearch?.longitude ?? longitude
                  }}
                />
              </div>
            </section>
          ) : null}

          {hasResults ? (
            <section className="card">
              <h2>Export Data</h2>
              <ExportButtons places={results ?? []} fileBase={fileBase} />
            </section>
          ) : null}

          {hasResults ? (
            <section className="card table-wrap">
              <table>
                <thead>
                  <tr>
                    {rows.length
                      ? Object.keys(rows[0]).map((header) => <th key={header}>{header}</th>)
                      : null}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={index}>
                      {Object.keys(row).map((header) => (
                        <td key={header}>{row[header]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ) : null}

          {!hasResults && !hasSearched && !loading ? (
            <section className="card">
              <div className="status info">
                Enter your search parameters and click Search to find places.
              </div>
              <h2>Example Searches</h2>
              <div className="grid">
                <div className="card">
                  <h3>Healthcare</h3>
                  <p>pharmacy</p>
                  <p>hospital</p>
                  <p>clinic</p>
                  <p>dentist</p>
                </div>
                <div className="card">
                  <h3>Food & Drink</h3>
                  <p>restaurant</p>
                  <p>cafe</p>
                  <p>pizza</p>
                  <p>coffee shop</p>
                </div>
                <div className="card">
                  <h3>Shopping</h3>
                  <p>supermarket</p>
                  <p>grocery store</p>
                  <p>shopping mall</p>
                  <p>bookstore</p>
                </div>
              </div>
            </section>
          ) : null}

          <footer className="footer">
            Built with love using Foursquare Places API | Powered by Next.js
          </footer>
        </main>
      </section>
    </div>
  );
}