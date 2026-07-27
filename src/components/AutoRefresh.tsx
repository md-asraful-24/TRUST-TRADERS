"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function AutoRefresh() {
  const pathname = usePathname();

  useEffect(() => {
    // Only poll if we are on an authenticated page (not public pages like login)
    if (pathname === "/login" || pathname === "/" || pathname === "/about") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/ping", { cache: "no-store" });
        
        if (res.status === 401 || res.status === 403) {
          // If unauthorized or forbidden, force reload
          window.location.reload();
          return;
        }

        if (res.ok) {
          const data = await res.json();
          
          if (data.changed) {
            window.location.reload();
          }
        }
      } catch (err) {
        // Silently ignore network errors to not spam the user if they go offline
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [pathname]);

  return null;
}
