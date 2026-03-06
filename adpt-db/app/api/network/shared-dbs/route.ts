// app/api/network/shared-dbs/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import { Friendship } from "@/lib/models/Network";
import { DatabaseModel } from "@/lib/models/Database";

export async function GET() {
  try {
    await connectDB();
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const friendships = await Friendship.find({
      $or: [{ requesterId: userId }, { recipientId: userId }],
      status: "Accepted"
    });

    const accessMap = new Map();
    friendships.forEach(f => {
      const isReq = f.requesterId === userId;
      const list = isReq ? f.recipientSharedDBs : f.requesterSharedDBs;
      const owner = isReq ? f.recipientUsername : f.requesterUsername;

      list.forEach((item: any) => {
        accessMap.set(item.databaseId, {
          role: item.role,
          ownerName: owner,
          grantedAt: item.grantedAt
        });
      });
    });

    const sharedIds = Array.from(accessMap.keys());
    const rawDatabases = await DatabaseModel.find({ _id: { $in: sharedIds } }, { records: 0 }).lean();

    const response = rawDatabases.map(db => {
      const meta = accessMap.get(db._id.toString());
      
      return {
        // This part is strictly DatabaseFolder
        details: {
          ...db,
          _id: db._id.toString(),
        },
        // This part is the "Outside" data
        network: {
          userRole: meta?.role || "Viewer",
          ownerName: meta?.ownerName || "Unknown",
          grantedAt: meta?.grantedAt || db.createdAt
        }
      };
    });

    return NextResponse.json({ databases: response }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}