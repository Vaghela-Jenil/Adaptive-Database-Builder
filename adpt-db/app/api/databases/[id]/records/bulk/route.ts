import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { DatabaseModel } from "@/lib/models/Database";
import { auth } from "@clerk/nextjs/server";
import { computeColumnValue } from "@/lib/computedColumns";
import { deleteCloudinaryAssets } from "@/lib/cloudinary";
import { extractUploadedFileAssetsFromRecordData, sanitizeRecordFileData } from "@/lib/uploadedFiles";
import { checkDatabaseAccess } from "@/lib/auth";

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

        const id = (await params).id;
        const { records } = await req.json();

        if (!records || !Array.isArray(records)) {
            return NextResponse.json(
                { error: "Invalid data format. Expected an array of records." },
                { status: 400 }
            );
        }

        // Check database access with Editor or Admin role required for importing
        const { database: db } = await checkDatabaseAccess(
            id,
            userId,
            "Editor"
        );

        const recordsToInsert = records.map((data) => {
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

            return {
                id: crypto.randomUUID(),
                data: enrichedData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
        });

        const updatedDatabase = await DatabaseModel.findByIdAndUpdate(
            id,
            {
                $push: { records: { $each: recordsToInsert } },
            },
            { new: true }
        );

        if (!updatedDatabase) {
            return NextResponse.json(
                { error: "Database not found." },
                { status: 404 }
            );
        }

        updatedDatabase.recordCount = updatedDatabase.records.length;
        updatedDatabase.save();

        return NextResponse.json(
            {
                message: "Bulk import successful",
                count: recordsToInsert.length
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Bulk Import Error:", error);
        if (error.message === "Insufficient permissions") {
            return NextResponse.json(
                { error: "You don't have permission to import records" },
                { status: 403 }
            );
        }
        if (error.message === "Access denied" || error.message === "Database not found") {
            return NextResponse.json(
                { error: "Database not found." },
                { status: 404 }
            );
        }
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message },
            { status: 500 }
        );
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const databaseId = (await params).id;

    // Check database access with Admin role required for clearing all records
    const { database: db } = await checkDatabaseAccess(
      databaseId,
      userId,
      "Admin"
    );

    const fileAssets = db.records.flatMap((record: any) =>
      extractUploadedFileAssetsFromRecordData(record.data || {}, db.formSchema)
    );

    db.records = [];
    db.recordCount = 0;
    await db.save();

    try {
      await deleteCloudinaryAssets(fileAssets);
    } catch (cleanupError) {
      console.error('Failed to clean up Cloudinary files after clearing records:', cleanupError);
    }

    return NextResponse.json({
      success: true,
      message: "All records cleared successfully",
      records: [],
    });

  } catch (error: any) {
    console.error("Clear All Error:", error);
    if (error.message === "Insufficient permissions") {
      return NextResponse.json(
        { error: "Only admins can clear all records" },
        { status: 403 }
      );
    }
    if (error.message === "Access denied" || error.message === "Database not found") {
      return NextResponse.json(
        { error: "Database not found or unauthorized" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to clear database" },
      { status: 500 }
    );
  }
}