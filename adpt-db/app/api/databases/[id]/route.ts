import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { DatabaseModel } from "../../../../lib/models/Database";
import { auth } from "@clerk/nextjs/server";

/* ---------------- GET ONE ---------------- */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { userId } = await auth();
    const id = (await params).id;
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const database = await DatabaseModel.findOne({
      _id: id,
      clerkId: userId,
    });

    if (!database)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(database);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch database" },
      { status: 500 }
    );
  }
}

/* ---------------- DELETE ---------------- */

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }>  }
) {
  try {
    await connectDB();

    const { userId } = await auth();
    const id = (await params).id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deleted = await DatabaseModel.findOneAndDelete({
      _id:id,
      clerkId: userId,
    });

    if (!deleted) {
      return NextResponse.json(
        { error: "Database not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete database" },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const body = await req.json();
    const { name, formSchema } = body;

    const updated = await DatabaseModel.findOneAndUpdate(
      { _id: id, clerkId: userId },
      {
        DatabaseName: name,
        fields: formSchema,
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { error: "Database not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update database" },
      { status: 500 }
    );
  }
}

