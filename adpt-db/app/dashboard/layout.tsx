'use client'
import { useUser } from "@clerk/nextjs";

export default function Layout({
  admin,
  users,
}: {
  admin: React.ReactNode;
  users: React.ReactNode;
}) {
  const { isLoaded, user } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="animate-pulse">Loading...</span>
      </div>
    );
  }

  // Determine Role (Check Clerk's publicMetadata)
  const role = user?.publicMetadata?.role ?? "user";

  return (
    <main>
      {role === "admin" ? admin : users}
    </main>
  );
}
