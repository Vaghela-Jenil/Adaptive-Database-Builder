import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Query } from "@/lib/models/Query";
import { auth, currentUser } from "@clerk/nextjs/server";
import { success } from "zod";

export async function POST(req: Request) {
  await connectDB();
  const { subject, message, priority } = await req.json();
  const user = await currentUser();

  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const newQuery = await Query.create({
    userId: user.id,
    user: user.firstName + " " + user.lastName,
    email: user.emailAddresses[0].emailAddress,
    subject,
    message,
    priority: priority || "medium",
  });

  return NextResponse.json({newQuery, success: true});
}

export async function GET() {
  await connectDB();
  const queries = await Query.find({}).sort({ createdAt: -1 });
  return NextResponse.json(queries);
}