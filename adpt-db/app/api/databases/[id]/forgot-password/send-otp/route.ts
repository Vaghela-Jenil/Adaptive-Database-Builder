import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";

import { connectDB } from "@/lib/mongodb";
import { DatabaseModel } from "@/lib/models/Database";
import { User } from "@/lib/models/Users";

const OTP_VALIDITY_MS = 5 * 60 * 1000;

function generateOtp(length = 6): string {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = (await params).id;

    const db = await DatabaseModel.findOne({ _id: id, clerkId: userId });
    if (!db) {
      return NextResponse.json({ error: "Database not found" }, { status: 404 });
    }

    const currentUser = await User.findOne({ clerkId: userId }).select("email userName");

    let targetEmail = currentUser?.email?.trim();
    if (!targetEmail) {
      try {
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(userId);
        const primaryEmail =
          clerkUser.emailAddresses.find((email) => email.id === clerkUser.primaryEmailAddressId)
            ?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress;

        targetEmail = primaryEmail?.trim();
      } catch (clerkError) {
        console.error("Failed to resolve email from Clerk:", clerkError);
      }
    }

    if (!targetEmail) {
      return NextResponse.json({ error: "No email found for this account" }, { status: 400 });
    }

    if (!process.env.GMAIL_USER?.trim() || !process.env.GMAIL_PASS?.trim()) {
      return NextResponse.json(
        { error: "Email service is not configured. Please contact admin." },
        { status: 500 }
      );
    }

    const otp = generateOtp(6);
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_VALIDITY_MS);

    db.passwordResetOtpHash = otpHash;
    db.passwordResetOtpExpiresAt = expiresAt;
    await db.save();

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER?.trim(),
        pass: process.env.GMAIL_PASS?.trim(),
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter.sendMail({
      from: `"Suventra" <${process.env.GMAIL_USER}>`,
      to: targetEmail,
      subject: "Database password reset OTP",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>Database Password Reset</h2>
          <p>Hello ${currentUser.userName || "User"},</p>
          <p>Your OTP for resetting password of <b>${db.DatabaseName}</b> is:</p>
          <p style="font-size: 28px; letter-spacing: 6px; font-weight: bold; margin: 16px 0;">${otp}</p>
          <p>This OTP is valid for <b>5 minutes</b>.</p>
          <p>If you did not request this, you can ignore this email.</p>
        </div>
      `,
    });

    return NextResponse.json(
      { success: true, message: "OTP sent to your Gmail address", expiresInSeconds: 300 },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to send database password reset OTP:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
