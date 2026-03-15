import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/Users"; // Assumes your existing User model
import { Friendship } from "@/lib/models/Network";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { userId } = await auth();
    const clerkUser = await currentUser();

    if (!userId || !clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const myUsername = clerkUser.username || clerkUser.firstName || "Unknown";
    const { action, ...data } = await req.json();
    

    switch (action) {
      // 1. FETCH ALL MY CONNECTIONS
      case "GET_NETWORK":
        // When getting connections, we also need to join user details to get images
        // If your Friendship model only has IDs, we fetch the names/images here
        const connections = await Friendship.find({
          $or: [{ requesterId: userId }, { recipientId: userId }]
        });

        // Optional: Fetch actual User objects to get the latest images
        const remoteIds = connections.map(c => c.requesterId === userId ? c.recipientId : c.requesterId);
        const profiles = await User.find({ clerkId: { $in: remoteIds } }).select("clerkId userName userImage");

        return NextResponse.json({ success: true, connections, profiles, myId: userId });

      // 2. SEARCH FOR USERS (Using your existing User Collection)
     case "SEARCH":
  const users = await User.find({
    $or: [
      { userName: { $regex: data.query, $options: "i" } },
      { email: { $regex: data.query, $options: "i" } }
    ],
    clerkId: { $ne: userId } 
  }).limit(5).select("clerkId userName email userImage"); // Add imageUrl here

  const formatted = users.map(u => ({
    clerkId: u.clerkId,
    username: u.userName || u.email.split('@')[0],
    imageUrl: u.userImage || "" // Send the image URL to the frontend
  }));
  return NextResponse.json({ success: true, users: formatted });

      // 3. SEND FRIEND REQUEST
      case "SEND_REQUEST":
        const alreadyExists = await Friendship.findOne({
          $or: [
            { requesterId: userId, recipientId: data.targetId },
            { requesterId: data.targetId, recipientId: userId }
          ]
        });
        if (alreadyExists) return NextResponse.json({ error: "Already connected" }, { status: 400 });

        const request = await Friendship.create({
          requesterId: userId,
          requesterUsername: myUsername,
          recipientId: data.targetId,
          recipientUsername: data.targetUsername,
          status: "Pending"
        });
        return NextResponse.json({ success: true, request });

      // 4. ACCEPT OR REJECT REQUEST
      case "RESPOND_REQUEST":
        if (data.response === "Accept") {
          await Friendship.findByIdAndUpdate(data.friendshipId, { status: "Accepted" });
        } else {
          await Friendship.findByIdAndDelete(data.friendshipId);
        }
        return NextResponse.json({ success: true });

      // 5. SHARE A DATABASE (Update either requester or recipient side)
      case "SHARE_DB":
        const friendshipToUpdate = await Friendship.findById(data.friendshipId);
        if (!friendshipToUpdate) {
          return NextResponse.json({ error: "Friendship not found" }, { status: 404 });
        }
        const fieldToPush = friendshipToUpdate.requesterId === userId
          ? "requesterSharedDBs"
          : "recipientSharedDBs";

        const existingShare = (friendshipToUpdate[fieldToPush] || []).find(
          (item: any) =>
            (data.databaseId && item.databaseId === data.databaseId) ||
            (!data.databaseId && item.databaseName === data.databaseName)
        );

        if (existingShare) {
          return NextResponse.json({ success: true, message: "Database already shared" });
        }

        await Friendship.findByIdAndUpdate(data.friendshipId, {
          $push: { [fieldToPush]: {databaseId : data.databaseId, databaseName: data.databaseName, role: data.role } }
        });
        return NextResponse.json({ success: true });

      // 5.1 UPDATE ROLE OF AN ALREADY SHARED DATABASE
      case "UPDATE_DB_ROLE":
        if (!["Admin", "Editor", "Viewer"].includes(data.role)) {
          return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }

        const friendshipToEditRole = await Friendship.findById(data.friendshipId);
        if (!friendshipToEditRole) {
          return NextResponse.json({ error: "Friendship not found" }, { status: 404 });
        }

        const fieldToUpdate = friendshipToEditRole.requesterId === userId
          ? "requesterSharedDBs"
          : "recipientSharedDBs";

        const arrayFilter = data.databaseId
          ? { "item.databaseId": data.databaseId }
          : { "item.databaseName": data.databaseName };

        await Friendship.updateOne(
          { _id: data.friendshipId },
          { $set: { [`${fieldToUpdate}.$[item].role`]: data.role } },
          { arrayFilters: [arrayFilter] }
        );

        return NextResponse.json({ success: true });

      // 6. REVOKE DATABASE ACCESS
      case "REVOKE_DB":
        const friendshipToRevoke = await Friendship.findById(data.friendshipId);
        if (!friendshipToRevoke) {
          return NextResponse.json({ error: "Friendship not found" }, { status: 404 });
        }
        const fieldToPull = friendshipToRevoke.requesterId === userId
          ? "requesterSharedDBs"
          : "recipientSharedDBs";

        await Friendship.findByIdAndUpdate(data.friendshipId, {
          $pull: { [fieldToPull]: { databaseName: data.databaseName } }
        });
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ error: "Unknown Action" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Network API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}