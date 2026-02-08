import { NextResponse } from "next/server";

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
  const query = searchParams.get("query") ?? "pharmacy";
  const latitude = Number(searchParams.get("latitude") ?? "0");
  const longitude = Number(searchParams.get("longitude") ?? "0");
  const radius = Number(searchParams.get("radius") ?? "1000");
  const limit = Number(searchParams.get("limit") ?? "10");
  const sort = searchParams.get("sort") ?? "RELEVANCE";

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return NextResponse.json(
      { error: "Invalid latitude/longitude" },
      { status: 400 }
    );
  }

  const url = new URL(API_URL);
  url.searchParams.set("query", query);
  url.searchParams.set("ll", `${latitude},${longitude}`);
  url.searchParams.set("radius", `${radius}`);
  url.searchParams.set("limit", `${limit}`);
  url.searchParams.set("sort", sort);

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${process.env.BEARER_TOKEN}`,
        "X-Places-Api-Version": API_VERSION
      },
      cache: "no-store"
    });

    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json(
        { error: `API Error ${res.status}`, details: text },
        { status: res.status }
      );
    }

    const data = JSON.parse(text);
    return NextResponse.json({ results: data?.results ?? [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Request failed", details: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
