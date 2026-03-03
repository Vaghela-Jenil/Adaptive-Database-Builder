"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import axios from "axios";

/**
 * Logs a visit to /api/analytics/visits whenever the pathname changes.
 * Place this component once inside a layout that wraps authenticated pages.
 */
export default function VisitTracker() {
  const pathname = usePathname();
  const lastPathRef = useRef<string>("");
  const hasLoggedRef = useRef(false);

  useEffect(() => {
    // Log on every mount (page load / refresh) and on pathname changes
    const shouldLog = !hasLoggedRef.current || pathname !== lastPathRef.current;

    if (pathname && shouldLog) {
      hasLoggedRef.current = true;
      lastPathRef.current = pathname;
      axios
        .post("/api/analytics/visits", { path: pathname })
        .then(() => {
          console.log("[VisitTracker] visit logged:", pathname);
        })
        .catch((err) => {
          console.error("[VisitTracker] failed to log visit:", err?.response?.data || err.message);
        });
    }
  }, [pathname]);

  return null; // renders nothing
}
