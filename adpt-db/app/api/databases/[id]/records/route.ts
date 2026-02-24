import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import { DatabaseModel } from "@/lib/models/Database";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const id = (await params).id;
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const dateQuery = searchParams.get("date") || "";
    const skip = (page - 1) * limit;

    const db = await DatabaseModel.findById(id);
    if (!db) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let filtered = [...db.records];

    // --- Defensive Date Filter ---
    if (dateQuery) {
      filtered = filtered.filter((r: any) => {
        if (!r.createdAt) return false;

        const d = new Date(r.createdAt);
        if (isNaN(d.getTime())) return false;

        // Convert UTC to "YYYY-MM-DD" based on a specific timezone
        // Using 'en-CA' because it natively outputs YYYY-MM-DD format
        const recordLocalDate = d.toLocaleDateString('en-CA', {
          timeZone: 'Asia/Kolkata', // Set this to your local timezone
        });

        // Now comparing "2026-02-24" (Local) === "2026-02-24" (Picker)
        return recordLocalDate === dateQuery;
      });
    }

    // --- Search Filter Logic ---
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter((r: any) =>
        r.data && Object.values(r.data).some(val =>
          String(val || "").toLowerCase().includes(s)
        )
      );
    }

    // --- Defensive Sort ---
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime() || 0;
      const dateB = new Date(b.createdAt).getTime() || 0;
      return dateB - dateA;
    });

    const totalCount = filtered.length;
    const paginatedRecords = filtered.slice(skip, skip + limit);

    return NextResponse.json({
      records: paginatedRecords,
      totalCount: totalCount
    });
  } catch (err: any) {
    console.error("API Error:", err.message); // This will show in your terminal
    return NextResponse.json({ error: "Fetch failed", details: err.message }, { status: 500 });
  }
}


export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data } = await req.json();

    const db = await DatabaseModel.findOne({
      _id: (await params).id,
      clerkId: userId,
    });

    if (!db) {
      return NextResponse.json({ error: "Database not found" }, { status: 404 });
    }

    const record = {
      id: crypto.randomUUID(),
      data: data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.records.push(record);
    db.recordCount = db.records.length;

    await db.save();

    return NextResponse.json({ message: "Record added successfully" }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Insert failed" }, { status: 500 });
  }
}


export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { ids } = await req.json();
    const databaseId = (await params).id;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "No record IDs provided" },
        { status: 400 }
      );
    }

    const updatedDatabase = await DatabaseModel.findOneAndUpdate(
      {
        _id: databaseId,
        clerkId: userId,
      },
      {
        $pull: {
          records: {
            id: { $in: ids },
          },
        },
        $inc: {
          recordCount: -ids.length,
        },
      },
      { new: true }
    );

    if (!updatedDatabase) {
      return NextResponse.json(
        { error: "Database not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      records: updatedDatabase.records,
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Bulk delete failed" },
      { status: 500 }
    );
  }
}
