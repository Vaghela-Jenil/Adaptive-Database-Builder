import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Query } from "@/lib/models/Query";
import { currentUser } from "@clerk/nextjs/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const user = await currentUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    // Find the query
    const query = await Query.findById(id);

    if (!query) {
      return NextResponse.json(
        { error: "Query not found" },
        { status: 404 }
      );
    }

    // Verify that the query belongs to the current user
    if (query.userId !== user.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Mark as read
    const updatedQuery = await Query.findByIdAndUpdate(
      id,
      { isReadByUser: true },
      { new: true }
    );

    return NextResponse.json({ updatedQuery, success: true });
  } catch (error: any) {
    console.error("PATCH Read Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
