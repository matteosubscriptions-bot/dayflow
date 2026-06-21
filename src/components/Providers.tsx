"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";

function OnlineWatcher() {
  const setOnline = useAppStore((s) => s.setOnline);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);

    // Register the offline app-shell service worker (prod only).
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, [setOnline]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <OnlineWatcher />
      {children}
    </SessionProvider>
  );
}
