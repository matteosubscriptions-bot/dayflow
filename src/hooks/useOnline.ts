"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";

/** Tiene aggiornato lo stato online/offline nello store globale. */
export function useOnline() {
  const online = useAppStore((s) => s.online);
  const setOnline = useAppStore((s) => s.setOnline);

  useEffect(() => {
    setOnline(navigator.onLine);
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, [setOnline]);

  return online;
}
