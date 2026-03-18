import { auth, clerkClient } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import { DatabaseModel } from "@/lib/models/Database";
import { Friendship } from "@/lib/models/Network";

export async function requireAuth() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

export async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const clerkUser = await clerkClient();

  const user = await clerkUser.users.getUser(userId);
  if (user.publicMetadata?.role !== "admin") {
    throw new Error("Forbidden");
  }

  return user;
}

export type DatabaseAccessLevel = "Admin" | "Editor" | "Viewer" | null;

export async function checkDatabaseAccess(
  databaseId: string,
  userId: string,
  requiredRole?: "Admin" | "Editor" | "Viewer"
): Promise<{ database: any; userRole: DatabaseAccessLevel }> {
  await connectDB();

  // Check if user is the owner
  const db = await DatabaseModel.findById(databaseId);
  if (!db) {
    throw new Error("Database not found");
  }

  if (db.clerkId === userId) {
    // User is the owner
    const ownerRole = db.role || "Admin";
    if (requiredRole && !isRoleSufficient(ownerRole, requiredRole)) {
      throw new Error("Insufficient permissions");
    }
    return { database: db, userRole: ownerRole };
  }

  // Check if database is shared with the user
  const friendship = await Friendship.findOne({
    $or: [
      {
        requesterId: db.clerkId,
        "requesterSharedDBs.databaseId": databaseId,
        recipientId: userId,
      },
      {
        recipientId: db.clerkId,
        "recipientSharedDBs.databaseId": databaseId,
        requesterId: userId,
      },
    ],
  });

  if (friendship) {
    let sharedDb;
    if (
      friendship.requesterId === db.clerkId &&
      friendship.recipientId === userId
    ) {
      sharedDb = friendship.requesterSharedDBs.find(
        (s: any) => s.databaseId === databaseId
      );
    } else {
      sharedDb = friendship.recipientSharedDBs.find(
        (s: any) => s.databaseId === databaseId
      );
    }

    if (sharedDb) {
      const userRole = sharedDb.role;
      if (requiredRole && !isRoleSufficient(userRole, requiredRole)) {
        throw new Error("Insufficient permissions");
      }
      return { database: db, userRole };
    }
  }

  throw new Error("Access denied");
}

function isRoleSufficient(
  userRole: string,
  requiredRole: string
): boolean {
  const roleHierarchy: Record<string, number> = {
    Admin: 3,
    Editor: 2,
    Viewer: 1,
  };

  return (roleHierarchy[userRole] || 0) >= (roleHierarchy[requiredRole] || 0);
}
