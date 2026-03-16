import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { DatabaseModel } from "@/lib/models/Database";
import { auth } from "@clerk/nextjs/server";
import { computeColumnValue } from "@/lib/computedColumns";
import { deleteCloudinaryAssets } from "@/lib/cloudinary";
import {
  diffRemovedUploadedFileAssets,
  extractUploadedFileAssetsFromRecordData,
  sanitizeRecordFileData,
} from "@/lib/uploadedFiles";


export async function PUT(req: NextRequest, { params}: { params: Promise<{ id: string; recordId: string }> }) {
  try {
    await connectDB();

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = (await params).id;
    const recordId = (await params).recordId;
    const { data } = await req.json();

    const db = await DatabaseModel.findOne({
      _id: id,
      clerkId: userId,
    });

    if (!db) {
      return NextResponse.json(
        { error: "Database not found" },
        { status: 404 }
      );
    }

    const record = db.records.find(
      (r: any) => r.id === recordId
    );

    if (!record) {
      return NextResponse.json(
        { error: "Record not found" },
        { status: 404 }
      );
    }

    const previousAssets = extractUploadedFileAssetsFromRecordData(record.data || {}, db.formSchema);
    let enrichedData = sanitizeRecordFileData({ ...data }, db.formSchema);
    
    // Keep existing computed column values, but recalculate them
    if (db.computedColumns && db.computedColumns.length > 0) {
      for (const column of db.computedColumns) {
        const computedValue = computeColumnValue(enrichedData, column, db.formSchema);
        if (computedValue !== null) {
          enrichedData[column.id] = computedValue;
        }
      }
    }

    record.data = enrichedData;
    record.updatedAt = new Date().toISOString();

    await db.save();

    const nextAssets = extractUploadedFileAssetsFromRecordData(record.data || {}, db.formSchema);
    const removedAssets = diffRemovedUploadedFileAssets(previousAssets, nextAssets);

    try {
      await deleteCloudinaryAssets(removedAssets);
    } catch (cleanupError) {
      console.error('Failed to clean up replaced Cloudinary files:', cleanupError);
    }

    return NextResponse.json(record);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Update failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; recordId: string }> }) {
  try {
    await connectDB();

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = (await params).id;
    const recordId = (await params).recordId;

    const db = await DatabaseModel.findOne({
      _id: id,
      clerkId: userId,
    });

    if (!db) {
      return NextResponse.json(
        { error: "Database not found" },
        { status: 404 }
      );
    }

    const recordToDelete = db.records.find((r: any) => r.id === recordId);
    const fileAssets = recordToDelete
      ? extractUploadedFileAssetsFromRecordData(recordToDelete.data || {}, db.formSchema)
      : [];

    db.records = db.records.filter((r: any) => r.id !== recordId);

    db.recordCount = db.records.length;

    await db.save();

    try {
      await deleteCloudinaryAssets(fileAssets);
    } catch (cleanupError) {
      console.error('Failed to clean up Cloudinary files after record delete:', cleanupError);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Delete failed" },
      { status: 500 }
    );
  }
}
