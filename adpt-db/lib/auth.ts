import { auth, clerkClient } from "@clerk/nextjs/server";

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
