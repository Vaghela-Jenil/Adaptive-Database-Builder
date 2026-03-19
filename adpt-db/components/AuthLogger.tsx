"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { logLogin, logLogout } from "@/lib/activityLogger";

/**
 * This component monitors authentication state changes and logs login/logout events.
 * It should be rendered inside the UserProvider but after ClerkProvider.
 * 
 * Uses sessionStorage to track login/logout state per browser session,
 * so page refreshes don't create duplicate login logs.
 */
export function AuthLogger() {
  const { user: clerkUser, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded) return;

    const loginSessionKey = "auth_session_logged_in";
    const isLoginLogged = sessionStorage.getItem(loginSessionKey);

    // If user is now logged in
    if (clerkUser) {
      // Only log login if we haven't logged it yet in this session
      if (!isLoginLogged) {
        console.debug("Auth state: User logged in");
        logLogin();
        // Mark that we've logged the login for this session
        sessionStorage.setItem(loginSessionKey, "true");
      }
    }
    // If user is now logged out
    else if (!clerkUser) {
      // Only log logout if we were previously logged in during this session
      if (isLoginLogged) {
        console.debug("Auth state: User logged out");
        logLogout();
        // Clear the session marker so next login gets logged again
        sessionStorage.removeItem(loginSessionKey);
      }
    }
  }, [clerkUser, isLoaded]);

  return null;
}
