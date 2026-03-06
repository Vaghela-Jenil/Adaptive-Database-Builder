import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Query } from "@/lib/models/Query";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const { adminReply, status } = await req.json();

    if (status === "resolved" && !adminReply) {
      return NextResponse.json(
        { error: "A reply is required to resolve a query." },
        { status: 400 }
      );
    }

    const updatedQuery = await Query.findByIdAndUpdate(
      id,
      { 
        adminReply, 
        status, 
        isReadByUser: false, 
        updatedAt: new Date() 
      },
      { new: true, runValidators: true }
    );

    if (!updatedQuery) {
      return NextResponse.json(
        { error: "Query not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({updatedQuery, success: true});
  } catch (error: any) {
    console.error("PATCH Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}