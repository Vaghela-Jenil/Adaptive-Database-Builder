import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { DatabaseModel } from "@/lib/models/Database";
import { auth } from "@clerk/nextjs/server";
import bcrypt from "bcrypt";
import { logActivityServer } from "@/lib/activity";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = (await params).id;
    const body = await req.json();
    const { password } = body;

    if (!password || typeof password !== "string" || password.trim().length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const hashPassword = await bcrypt.hash(password.trim(), 10);

    const db = await DatabaseModel.findOneAndUpdate({
      clerkId: userId,
      _id: id
    }, { password: hashPassword, hasPassword: true }, { new: true });

    if (!db) {
      return NextResponse.json({ error: "Database not found" }, { status: 404 });
    }

    // Log activity
    await logActivityServer({
      clerkId: userId,
      type: "password",
      title: "Set Password",
      description: `Set password protection for '${db.DatabaseName}' database`,
      metadata: {
        databaseId: db._id?.toString(),
        databaseName: db.DatabaseName,
      },
    });

    return NextResponse.json(db, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to set password" },
      { status: 500 }
    );
  }
}

