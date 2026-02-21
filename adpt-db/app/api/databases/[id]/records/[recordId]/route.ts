import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { DatabaseModel } from "@/lib/models/Database";
import { auth } from "@clerk/nextjs/server";


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

    record.data = data;
    record.updatedAt = new Date().toISOString();

    await db.save();

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

    db.records = db.records.filter(
      (r: any) => r.id !== recordId
    );

    db.recordCount = db.records.length;

    await db.save();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Delete failed" },
      { status: 500 }
    );
  }
}
