import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Query } from "@/lib/models/Query";
import { currentUser } from "@clerk/nextjs/server";
import { User } from "@/lib/models/Users";
import { sendQueryResolutionEmail } from "@/app/actions/queryEmail";

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

    // Check if user is admin
    const adminUser = await User.findOne({ clerkId: user.id });

    if (!adminUser || adminUser.role !== "admin") {
      return new NextResponse("Forbidden - Admin access required", { status: 403 });
    }

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
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!updatedQuery) {
      return NextResponse.json(
        { error: "Query not found" },
        { status: 404 }
      );
    }

    // Send email notification if query is being resolved
    if (status === "resolved" && adminReply) {
      try {
        await sendQueryResolutionEmail({
          toEmail: updatedQuery.email,
          userName: updatedQuery.user,
          querySubject: updatedQuery.subject,
          queryMessage: updatedQuery.message,
          adminReply: adminReply,
        });
        console.log(`Resolution email sent to ${updatedQuery.email}`);
      } catch (emailError) {
        console.error("Failed to send resolution email:", emailError);
        // Don't fail the entire request if email fails
      }
    }

    return NextResponse.json({ updatedQuery, success: true });
  } catch (error: any) {
    console.error("PATCH Admin Query Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
