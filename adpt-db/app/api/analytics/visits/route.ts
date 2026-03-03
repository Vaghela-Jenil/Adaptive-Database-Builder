import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import { VisitLog } from "@/lib/models/VisitLog";
import mongoose from "mongoose";

// One-time cleanup: drop stale unique index on clerkId if it exists from the old schema
let indexCleaned = false;
async function ensureCleanIndexes() {
  if (indexCleaned) return;
  indexCleaned = true;
  try {
    const collection = mongoose.connection.collection("visitlogs");
    const indexes = await collection.indexes();
    const staleIndex = indexes.find(
      (idx: any) => idx.unique && idx.key?.clerkId
    );
    if (staleIndex && staleIndex.name) {
      await collection.dropIndex(staleIndex.name);
      console.log("[VisitLog] Dropped stale unique index:", staleIndex.name);
    }
  } catch {
    // Collection may not exist yet — that's fine
  }
}

// POST /api/analytics/visits — log a visit
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    await ensureCleanIndexes();
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { path } = await req.json();

    const visitEntry = { path: path || "/", visitedAt: new Date() };

    // Push visit into the user's visits array; creates doc if first visit
    await VisitLog.findOneAndUpdate(
      { clerkId: userId },
      { $push: { visits: visitEntry } },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err: any) {
    console.error("Visit log error:", err?.message || err);
    return NextResponse.json(
      { error: "Failed to log visit", details: err?.message },
      { status: 500 }
    );
  }
}

// GET /api/analytics/visits?filter=day|week|month
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    await ensureCleanIndexes();
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const filter = req.nextUrl.searchParams.get("filter") || "week";

    const now = new Date();
    let startDate: Date;
    let groupFormat: Record<string, any>;

    if (filter === "day") {
      // Last 24 hours, grouped by hour
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      groupFormat = {
        year: { $year: "$visits.visitedAt" },
        month: { $month: "$visits.visitedAt" },
        day: { $dayOfMonth: "$visits.visitedAt" },
        hour: { $hour: "$visits.visitedAt" },
      };
    } else if (filter === "month") {
      // Last 30 days, grouped by day
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      groupFormat = {
        year: { $year: "$visits.visitedAt" },
        month: { $month: "$visits.visitedAt" },
        day: { $dayOfMonth: "$visits.visitedAt" },
      };
    } else {
      // Last 7 days, grouped by day (default: week)
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      groupFormat = {
        year: { $year: "$visits.visitedAt" },
        month: { $month: "$visits.visitedAt" },
        day: { $dayOfMonth: "$visits.visitedAt" },
      };
    }

    const pipeline = [
      {
        $match: { clerkId: userId },
      },
      // Unwind the visits array so each entry becomes a separate document
      { $unwind: "$visits" },
      {
        $match: {
          "visits.visitedAt": { $gte: startDate },
        },
      },
      {
        $group: {
          _id: groupFormat,
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 as 1 } },
    ];

    const results = await VisitLog.aggregate(pipeline);

    // Build chart-ready data
    const chartData: { label: string; visits: number }[] = [];

    if (filter === "day") {
      for (let i = 23; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 60 * 60 * 1000);
        const hour = d.getHours();
        const label = `${hour.toString().padStart(2, "0")}:00`;
        const match = results.find(
          (r: any) =>
            r._id.year === d.getFullYear() &&
            r._id.month === d.getMonth() + 1 &&
            r._id.day === d.getDate() &&
            r._id.hour === hour
        );
        chartData.push({ label, visits: match?.count || 0 });
      }
    } else {
      const days = filter === "month" ? 30 : 7;
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const label = d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        const match = results.find(
          (r: any) =>
            r._id.year === d.getFullYear() &&
            r._id.month === d.getMonth() + 1 &&
            r._id.day === d.getDate()
        );
        chartData.push({ label, visits: match?.count || 0 });
      }
    }

    const totalVisits = results.reduce(
      (sum: number, r: any) => sum + r.count,
      0
    );

    return NextResponse.json({ chartData, totalVisits });
  } catch (err) {
    console.error("Visit analytics error:", err);
    return NextResponse.json(
      { error: "Failed to fetch visit analytics" },
      { status: 500 }
    );
  }
}
