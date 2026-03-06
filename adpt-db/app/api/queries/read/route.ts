import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Query } from "@/lib/models/Query";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  await connectDB();
  // Simply flip the read flag so the notification disappears
  const updated = await Query.findByIdAndUpdate(params.id, { isReadByUser: true }, { new: true });
  return NextResponse.json(updated);
}