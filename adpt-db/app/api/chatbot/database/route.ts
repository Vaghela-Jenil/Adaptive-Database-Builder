import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const FASTAPI_BASE_URL = process.env.FASTAPI_URL || "http://localhost:5001";

export async function GET(req: NextRequest) {
  try {
    // Get clerkId server-side from Clerk auth (secure, no client spoofing)
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const formName = searchParams.get("form_name");
    const query = searchParams.get("query");

    if (!formName || !query) {
      return NextResponse.json(
        { error: "Missing required parameters: form_name, query" },
        { status: 400 }
      );
    }

    const encodedClerkId = encodeURIComponent(userId);
    const encodedFormName = encodeURIComponent(formName);
    const encodedQuery = encodeURIComponent(query);

    const url = `${FASTAPI_BASE_URL}/api/chatbot/${encodedClerkId}/${encodedFormName}/${encodedQuery}`;

    console.log("[database-chatbot] Forwarding to FastAPI:", url);

    const fastApiRes = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data = await fastApiRes.json();

    if (!fastApiRes.ok) {
      console.error("[database-chatbot] FastAPI error:", data);
      return NextResponse.json(
        { error: data.detail || data.error || "FastAPI request failed" },
        { status: fastApiRes.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[database-chatbot] Error:", message);
    return NextResponse.json(
      { error: `Failed to connect to AI service: ${message}` },
      { status: 500 }
    );
  }
}
