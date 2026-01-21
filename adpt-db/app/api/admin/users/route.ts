import { requireAdmin } from "@/lib/auth";
import { User } from "@/lib/models/Users";
import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  await requireAdmin();
  await connectDB();

  const users = await User.find().select("-_id -__v");

  return NextResponse.json(users);
}
