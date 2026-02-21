import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { DatabaseModel } from "../../../lib/models/Database";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    await connectDB();

    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const databases = await DatabaseModel.find({ clerkId: userId }).sort({
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
    const { name, formSchema } = body;

    const existing = await DatabaseModel.findOneAndUpdate({
      clerkId: userId,
      DatabaseName: name,
    }, {
      formSchema: formSchema,
    }, { new: true });


    return NextResponse.json(existing, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update database" },
      { status: 500 }
    );
  }
}

