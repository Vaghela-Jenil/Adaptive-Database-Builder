import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import { DatabaseModel } from "@/lib/models/Database";
import { computeColumnValue } from "@/lib/computedColumns";
import { deleteCloudinaryAssets } from "@/lib/cloudinary";
import { extractUploadedFileAssetsFromRecordData, sanitizeRecordFileData } from "@/lib/uploadedFiles";
import { checkDatabaseAccess } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const id = (await params).id;
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const dateQuery = searchParams.get("date") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const skip = (page - 1) * limit;

    const db = await DatabaseModel.findById(id);
    if (!db) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let filtered = [...db.records];

    // Identify user-defined date-picker field IDs from the schema
    const dateFieldIds = (db.formSchema || [])
      .filter((f: any) => f.type === 'date-picker')
      .map((f: any) => f.id);

    // --- Defensive Date Filter (createdAt + user date columns) ---
    if (dateQuery) {
      filtered = filtered.filter((r: any) => {
        // Check createdAt
        if (r.createdAt) {
          const d = new Date(r.createdAt);
          if (!isNaN(d.getTime())) {
            const recordLocalDate = d.toLocaleDateString('en-CA', {
              timeZone: 'Asia/Kolkata',
            });
            if (recordLocalDate === dateQuery) return true;
          }
        }

        // Check user-defined date columns
        if (r.data && dateFieldIds.length > 0) {
          for (const fieldId of dateFieldIds) {
            const val = r.data[fieldId];
            if (!val) continue;
            const parsed = new Date(val);
            if (!isNaN(parsed.getTime())) {
              const localDate = parsed.toLocaleDateString('en-CA', {
                timeZone: 'Asia/Kolkata',
              });
              if (localDate === dateQuery) return true;
            }
            // Also support direct YYYY-MM-DD string match
            if (typeof val === 'string' && val.slice(0, 10) === dateQuery) return true;
          }
        }

        return false;
      });
    }

    // --- Date Range Filter (dateFrom / dateTo) ---
    if (dateFrom || dateTo) {
      const fromDate = dateFrom ? new Date(dateFrom + "T00:00:00") : null;
      const toDate = dateTo ? new Date(dateTo + "T23:59:59") : null;

      filtered = filtered.filter((r: any) => {
        if (r.createdAt) {
          const d = new Date(r.createdAt);
          if (!isNaN(d.getTime())) {
            if (fromDate && d < fromDate) return false;
            if (toDate && d > toDate) return false;
            return true;
          }
        }
        return false;
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
    const databaseId = (await params).id;

    // Check database access with Editor or Admin role required for posting
    const { database: db } = await checkDatabaseAccess(
      databaseId,
      userId,
      "Editor"
    );

    // Calculate computed columns if they exist
    let enrichedData = sanitizeRecordFileData({ ...data }, db.formSchema);
    if (db.computedColumns && db.computedColumns.length > 0) {
      for (const column of db.computedColumns) {
        const computedValue = computeColumnValue(enrichedData, column, db.formSchema);
        if (computedValue !== null) {
          enrichedData[column.id] = computedValue;
        }
      }
    }

    const record = {
      id: crypto.randomUUID(),
      data: enrichedData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.records.push(record);
    db.recordCount = db.records.length;

    await db.save();

    return NextResponse.json({ message: "Record added successfully" }, { status: 201 });
  } catch (err: any) {
    console.error(err);
    if (err.message === "Insufficient permissions") {
      return NextResponse.json({ error: "You don't have permission to add records" }, { status: 403 });
    }
    if (err.message === "Access denied" || err.message === "Database not found") {
      return NextResponse.json({ error: "Database not found" }, { status: 404 });
    }
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

    // Check database access with Admin role required for deletion
    const { database: db } = await checkDatabaseAccess(
      databaseId,
      userId,
      "Admin"
    );

    const recordsToDelete = db.records.filter((record: any) => ids.includes(record.id));
    const fileAssets = recordsToDelete.flatMap((record: any) =>
      extractUploadedFileAssetsFromRecordData(record.data || {}, db.formSchema)
    );

    db.records = db.records.filter((record: any) => !ids.includes(record.id));
    db.recordCount = db.records.length;
    await db.save();

    try {
      await deleteCloudinaryAssets(fileAssets);
    } catch (cleanupError) {
      console.error('Failed to clean up Cloudinary files after bulk delete:', cleanupError);
    }

    return NextResponse.json({
      success: true,
      records: db.records,
    });

  } catch (error: any) {
    console.error(error);
    if (error.message === "Insufficient permissions") {
      return NextResponse.json(
        { error: "Only admins can delete records" },
        { status: 403 }
      );
    }
    if (error.message === "Access denied" || error.message === "Database not found") {
      return NextResponse.json(
        { error: "Database not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Bulk delete failed" },
      { status: 500 }
    );
  }
}
