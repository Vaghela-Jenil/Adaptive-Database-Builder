import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

type OrderStatus = "not_ordered" | "ordered" | "shipped" | "out_for_delivery" | "delivered";

const STATUS_KEYWORDS: Array<{ status: OrderStatus; keywords: string[] }> = [
  {
    status: "delivered",
    keywords: [
      "delivered",
      "order delivered",
      "package delivered",
      "successfully delivered",
      "shipment delivered",
    ],
  },
  {
    status: "out_for_delivery",
    keywords: [
      "out for delivery",
      "arriving today",
      "will be delivered today",
      "delivery attempt",
    ],
  },
  {
    status: "shipped",
    keywords: [
      "shipped",
      "in transit",
      "dispatched",
      "on the way",
      "shipment picked up",
      "package departed",
    ],
  },
  {
    status: "ordered",
    keywords: [
      "order confirmed",
      "order placed",
      "confirmed",
      "processing",
      "packed",
      "ready to ship",
    ],
  },
];

function normalizeTrackingUrl(input: string): URL | null {
  const raw = input.trim();
  if (!raw) return null;

  try {
    return new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }
}

function isPrivateIPv4(hostname: string): boolean {
  const ipParts = hostname.split(".").map((part) => Number(part));
  if (ipParts.length !== 4 || ipParts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return false;
  }

  const [a, b] = ipParts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;
  return false;
}

function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();

  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) {
    return true;
  }

  if (host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80")) {
    return true;
  }

  if (isPrivateIPv4(host)) {
    return true;
  }

  return false;
}

function extractText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function detectStatusFromText(text: string): { status: OrderStatus | null; matchedBy?: string } {
  for (const entry of STATUS_KEYWORDS) {
    const found = entry.keywords.find((keyword) => text.includes(keyword));
    if (found) {
      return { status: entry.status, matchedBy: found };
    }
  }
  return { status: null };
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const trackingUrl = typeof body?.trackingUrl === "string" ? body.trackingUrl : "";

    const normalizedUrl = normalizeTrackingUrl(trackingUrl);
    if (!normalizedUrl) {
      return NextResponse.json({ error: "Invalid tracking URL" }, { status: 400 });
    }

    if (!["http:", "https:"].includes(normalizedUrl.protocol)) {
      return NextResponse.json({ error: "Unsupported protocol" }, { status: 400 });
    }

    if (isBlockedHost(normalizedUrl.hostname)) {
      return NextResponse.json({ error: "Blocked tracking host" }, { status: 400 });
    }

    const response = await fetch(normalizedUrl.toString(), {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AdaptiveDBStatusBot/1.0)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      cache: "no-store",
      redirect: "follow",
    });

    if (!response.ok) {
      return NextResponse.json({ status: null, reason: "tracking_page_unavailable" });
    }

    const finalUrl = new URL(response.url);
    if (isBlockedHost(finalUrl.hostname)) {
      return NextResponse.json({ error: "Blocked redirect host" }, { status: 400 });
    }

    const html = await response.text();
    const extracted = extractText(html);
    const { status, matchedBy } = detectStatusFromText(extracted);

    return NextResponse.json({
      status,
      matchedBy: matchedBy || null,
      sourceHost: finalUrl.hostname,
    });
  } catch {
    return NextResponse.json({ status: null, reason: "detection_failed" }, { status: 500 });
  }
}
