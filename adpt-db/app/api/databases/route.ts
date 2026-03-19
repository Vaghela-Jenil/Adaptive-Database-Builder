import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { DatabaseModel } from "../../../lib/models/Database";
import { auth } from "@clerk/nextjs/server";
import axios from "axios";
import { logActivityServer } from "@/lib/activity";


export async function GET() {
  try {
    await connectDB();
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const databases = await DatabaseModel.find({ clerkId: userId}, { records: 0  }).sort({
      createdAt: -1,
    });

    return NextResponse.json({ databases }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch databases" },
      { status: 500 }
    );
  }
}


export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, formSchema } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Database name required" },
        { status: 400 }
      );
    }

    const existing = await DatabaseModel.findOne({
      clerkId: userId,
      DatabaseName: name,
    });

    if (existing) {
      return NextResponse.json(
        { error: "Database name already taken" },
        { status: 409 }
      );
    }

    const db = await DatabaseModel.create({
      clerkId: userId,
      DatabaseName: name,
      formSchema: formSchema,
      recordCount: 0,
      records: [],
    });

    // Log activity
    await logActivityServer({
      clerkId: userId,
      type: "create",
      title: "Created Database",
      description: `Created new database '${name}'`,
      metadata: {
        databaseId: db._id?.toString(),
        databaseName: name,
      },
    });

    return NextResponse.json(db, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create database" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectDB();

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, formSchema } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Database ID is required" },
        { status: 400 }
      );
    }

    const oldDoc = await DatabaseModel.findOne({
      _id: id,
      clerkId: userId,
    });

    if (!oldDoc) {
      return NextResponse.json(
        { error: "Database not found" },
        { status: 404 }
      );
    }

    const oldLabels: string[] = (oldDoc.formSchema ?? []).map(
      (f: any) => f.label
    ).filter(Boolean);

    // Determine which field IDs were removed
    const newFieldIds = new Set(
      (formSchema ?? []).map((f: any) => f.id).filter(Boolean)
    );
    const removedFieldIds: string[] = (oldDoc.formSchema ?? [])
      .map((f: any) => f.id)
      .filter((id: string) => id && !newFieldIds.has(id));

    // Update formSchema
    oldDoc.formSchema = formSchema;

    // Clean record data for removed fields so stale values
    // don't appear in chatbot query results.
    if (removedFieldIds.length > 0 && oldDoc.records?.length > 0) {
      oldDoc.records = oldDoc.records.map((record: any) => {
        const cleanedData = { ...record.data };
        for (const fieldId of removedFieldIds) {
          delete cleanedData[fieldId];
        }
        return { ...record, data: cleanedData };
      });
    }

    await oldDoc.save();

    // Invalidate stale synonym cache (best-effort, non-blocking)
    if (oldLabels.length > 0) {
      axios.post("http://localhost:5001/api/invalidate-synonym-cache", { old_labels: oldLabels }).catch(() => {});
    }

    return NextResponse.json(oldDoc, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update database" },
      { status: 500 }
    );
  }
}


