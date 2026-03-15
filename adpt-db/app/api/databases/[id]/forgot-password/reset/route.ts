import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import bcrypt from "bcrypt";

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
    const { otp, newPassword } = await req.json();

    if (!otp || typeof otp !== "string") {
      return NextResponse.json({ error: "OTP is required" }, { status: 400 });
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const db = await DatabaseModel.findOne({ _id: id, clerkId: userId });
    if (!db) {
      return NextResponse.json({ error: "Database not found" }, { status: 404 });
    }

    if (!db.passwordResetOtpHash || !db.passwordResetOtpExpiresAt) {
      return NextResponse.json(
        { error: "No active reset OTP. Please request OTP again." },
        { status: 400 }
      );
    }

    if (new Date(db.passwordResetOtpExpiresAt).getTime() < Date.now()) {
      db.passwordResetOtpHash = null;
      db.passwordResetOtpExpiresAt = null;
      await db.save();

      return NextResponse.json(
        { error: "OTP expired. Please request a new OTP." },
        { status: 400 }
      );
    }

    const isOtpValid = await bcrypt.compare(otp, db.passwordResetOtpHash);
    if (!isOtpValid) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    db.password = passwordHash;
    db.hasPassword = true;
    db.passwordResetOtpHash = null;
    db.passwordResetOtpExpiresAt = null;

    await db.save();

    return NextResponse.json(
      { success: true, message: "Database password has been reset" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to reset database password:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
