'use client';

import { useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import axios from "axios";

export default function Layout({
  admin,
  users,
}: {
  admin: React.ReactNode;
  users: React.ReactNode;
}) {
  const { isLoaded, isSignedIn, user } = useUser();
  const hasSynced = useRef(false); // Prevents double-syncing in Strict Mode

  useEffect(() => {
    // Only sync if logged in and we haven't synced this session
    if (!isLoaded || !isSignedIn || hasSynced.current) return;

    const syncUser = async () => {
      try {
        hasSynced.current = true;
        await axios.post("/api/auth/create-user");
      } catch (err) {
        console.error("User sync failed", err);
        // Optional: hasSynced.current = false; (if you want to retry)
      }
    };

    syncUser();
  }, [isLoaded, isSignedIn]);

  // Handle Loading State
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
