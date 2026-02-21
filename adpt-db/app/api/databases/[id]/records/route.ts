import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { DatabaseModel } from "@/lib/models/Database";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { userId } = await auth();

    const id = (await params).id;
    const db = await DatabaseModel.findOne({
      _id: id,
      clerkId: userId,
    });

    if (!db) {
      return NextResponse.json({ error: "Database not found" }, { status: 404 });
    }

    return NextResponse.json(db.records);
  } catch (err) {
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
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

    return NextResponse.json({message: "Record added successfully"}, { status: 201 });
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
