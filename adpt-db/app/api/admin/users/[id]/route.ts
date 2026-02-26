import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { User } from "@/lib/models/Users";
import { connectDB } from "@/lib/mongodb";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id: targetId } = await params;
    const client = await clerkClient();
    
    await client.users.deleteUser(targetId);
    await User.findOneAndDelete({ clerkId: targetId });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id: targetId } = await params;
    const { banned, role } = await req.json();
    const client = await clerkClient();

    // Fix: Use dedicated Clerk methods for banning
    if (banned === true) {
      await client.users.banUser(targetId);
    } else {
      await client.users.unbanUser(targetId);
    }

    // Update Metadata and Database
    await client.users.updateUser(targetId, { publicMetadata: { role } });
    await User.findOneAndUpdate({ clerkId: targetId }, { banned, role });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}