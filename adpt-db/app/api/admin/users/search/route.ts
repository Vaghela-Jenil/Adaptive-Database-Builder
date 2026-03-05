import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/Users";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { query } = await req.json();

    if (!query) return NextResponse.json({ success: true, users: [] });

    // Search for users by email or name
    const users = await User.find({
      $or: [
        { email: { $regex: query, $options: "i" } },
        { userName: { $regex: query, $options: "i" } }
      ]
    }).limit(5).select("email userName");

    return NextResponse.json({ success: true, users });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Search failed" }, { status: 500 });
  }
}