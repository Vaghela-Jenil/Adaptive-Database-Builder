import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import { DatabaseModel } from "@/lib/models/Database";
import { Friendship } from "@/lib/models/Network";
import axios from "axios";

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
    const databaseId = searchParams.get("databaseId");
    const formName = searchParams.get("form_name");
    const query = searchParams.get("query");

    if (!formName || !query) {
      return NextResponse.json(
        { error: "Missing required parameters: form_name, query" },
        { status: 400 }
      );
    }

    // Connect to DB and verify access to the database
    await connectDB();

    // Find the database by ID
    const db = await DatabaseModel.findById(databaseId);
    if (!db) {
      return NextResponse.json(
        { error: "Database not found" },
        { status: 404 }
      );
    }

    let hasAccess = false;
    let ownerClerkId = db.clerkId;

    // Check if user is the owner
    if (db.clerkId === userId) {
      hasAccess = true;
    } else {
      // Check if database is shared with the user (as Admin or Editor)
      const friendship = await Friendship.findOne({
        $or: [
          {
            requesterId: db.clerkId,
            "requesterSharedDBs.databaseId": databaseId,
            recipientId: userId,
          },
          {
            recipientId: db.clerkId,
            "recipientSharedDBs.databaseId": databaseId,
            requesterId: userId,
          },
        ],
      });

      if (friendship) {
        let sharedDb;
        if (friendship.requesterId === db.clerkId && friendship.recipientId === userId) {
          sharedDb = friendship.requesterSharedDBs.find((s: any) => s.databaseId === databaseId);
        } else {
          sharedDb = friendship.recipientSharedDBs.find((s: any) => s.databaseId === databaseId);
        }

        // Allow access only for Admin and Editor roles
        if (sharedDb && (sharedDb.role === "Admin" || sharedDb.role === "Editor")) {
          hasAccess = true;
        }
      }
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: "You don't have access to this database" },
        { status: 403 }
      );
    }

    // Use the database owner's clerkId for FastAPI query
    const encodedClerkId = encodeURIComponent(ownerClerkId);
    const encodedFormName = encodeURIComponent(formName);
    const encodedQuery = encodeURIComponent(query);

    const url = `${FASTAPI_BASE_URL}/api/chatbot/${encodedClerkId}/${encodedFormName}/${encodedQuery}`;
    const fastApiRes = await axios.get(url);
    const data = fastApiRes.data;

    return NextResponse.json(data);
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      console.error("[database-chatbot] FastAPI error:", error.response.data);
      return NextResponse.json(
        { error: error.response.data?.detail || error.response.data?.error || "FastAPI request failed" },
        { status: error.response.status }
      );
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error("[database-chatbot] Error:", message);
    return NextResponse.json(
      { error: `Failed to connect to AI service: ${message}` },
      { status: 500 }
    );
  }
}
