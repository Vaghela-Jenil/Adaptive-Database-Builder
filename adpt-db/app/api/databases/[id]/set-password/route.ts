import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { DatabaseModel } from "@/lib/models/Database";
import { auth } from "@clerk/nextjs/server";
import bcrypt from "bcrypt";

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

    const hashPassword = await bcrypt.hash(password, 10);

    const db = await DatabaseModel.findByIdAndUpdate({
      clerkId: userId,
        _id: id
    }, { password: hashPassword, hasPassword: true }, { new: true });

    return NextResponse.json(db, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to set password" },
      { status: 500 }
    );
  }
}

