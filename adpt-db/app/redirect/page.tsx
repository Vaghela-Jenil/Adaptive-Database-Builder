'use client';

import { useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function AuthSync() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const syncAttempted = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user?.id || syncAttempted.current) return;

    syncAttempted.current = true;

    const syncAndRedirect = async () => {
      try {
        const data = await axios.post("/api/auth/verify-user");
        const role = data.data.user.role || "user";

        if (role === "admin") {
          router.push("/admin/dashboard");
        } else {
          router.push("/user/dashboard");
        }

      } catch (err: any) {
        if (err.response?.status === 403) {
          console.error("Access Denied: User is banned.");
        }
        throw new Error("Sync Error:", err.message);
      }
    };

    syncAndRedirect();
  }, [isLoaded, isSignedIn, user?.id, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500 animate-pulse">Syncing profile...</p>
    </div>
  );
}