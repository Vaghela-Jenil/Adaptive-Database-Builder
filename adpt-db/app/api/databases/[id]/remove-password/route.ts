import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
const bcrypt = require("bcrypt");

import { connectDB } from "@/lib/mongodb";
import { DatabaseModel } from "@/lib/models/Database";

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
    const { currentPassword } = await req.json();

    if (!currentPassword || typeof currentPassword !== "string") {
      return NextResponse.json({ error: "Current password is required" }, { status: 400 });
    }

    const db = await DatabaseModel.findOne({ _id: id, clerkId: userId });
    if (!db) {
      return NextResponse.json({ error: "Database not found" }, { status: 404 });
    }

    if (!db.hasPassword || !db.password) {
      return NextResponse.json({ error: "Database does not have a password" }, { status: 400 });
    }

    const valid = await bcrypt.compare(currentPassword, db.password);
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    db.password = "";
    db.hasPassword = false;
    db.passwordResetOtpHash = null;
    db.passwordResetOtpExpiresAt = null;

    await db.save();

    return NextResponse.json(
      { success: true, message: "Database password removed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to remove database password:", error);
    return NextResponse.json({ error: "Failed to remove password" }, { status: 500 });
  }
}
