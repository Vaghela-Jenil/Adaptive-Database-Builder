import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Query } from "@/lib/models/Query";
import { currentUser } from "@clerk/nextjs/server";
import { User } from "@/lib/models/Users";

export async function GET() {
  try {
    await connectDB();
    const user = await currentUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if user is admin
    const adminUser = await User.findOne({ clerkId: user.id });

    if (!adminUser || adminUser.role !== "admin") {
      return new NextResponse("Forbidden - Admin access required", { status: 403 });
    }

    // Admin can see all queries
    const queries = await Query.find().sort({ createdAt: -1 });
    return NextResponse.json(queries);
  } catch (error: any) {
    console.error("GET Admin Queries Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
