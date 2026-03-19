import { NextResponse } from "next/server";
import axios from "axios";

const API_URL = "https://places-api.foursquare.com/places/search";
const API_VERSION = "2025-06-17";

export async function GET(request: Request) {
  if (!process.env.BEARER_TOKEN) {
    return NextResponse.json(
      { error: "Missing BEARER_TOKEN env var" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") ?? "retail";
  const latitude = Number(searchParams.get("latitude") ?? "0");
  const longitude = Number(searchParams.get("longitude") ?? "0");
  const radius = Number(searchParams.get("radius") ?? "1000");
  const limit = Number(searchParams.get("limit") ?? "10");
  const sort = searchParams.get("sort") ?? "RELEVANCE";
  const open_now = searchParams.get("open_now");

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return NextResponse.json(
      { error: "Invalid latitude/longitude" },
      { status: 400 }
    );
  }
  if (open_now !== null && open_now !== "true" && open_now !== "false") {
    return NextResponse.json(
      { error: "open_now must be 'true' or 'false'" },
      { status: 400 }
    );
  }

  const url = new URL(API_URL);
  url.searchParams.set("query", query);
  url.searchParams.set("ll", `${latitude},${longitude}`);
  url.searchParams.set("radius", `${radius}`);
  url.searchParams.set("limit", `${limit}`);
  url.searchParams.set("sort", sort);
  if (open_now !== null) {
    url.searchParams.set("open_now", open_now);
  }

  try {
    const res = await axios.get(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${process.env.BEARER_TOKEN}`,
        "X-Places-Api-Version": API_VERSION
      }
    });

    return NextResponse.json({ results: res.data?.results ?? [] });
  } catch (err: any) {
    const status = err.response?.status || 500;
    const details = err.response?.data || err?.message || String(err);
    return NextResponse.json(
      { error: "Request failed", details },
      { status }
    );
  }
}