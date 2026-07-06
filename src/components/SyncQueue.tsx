"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { flushQueue, pendingCount } from "@/lib/offlineQueue";

/** Sincronizza la coda offline all'avvio e quando torna la connessione. */
export function SyncQueue() {
  const router = useRouter();
  const setPendingSync = useAppStore((s) => s.setPendingSync);

  useEffect(() => {
    let cancelled = false;

    async function sync() {
      try {
        const before = await pendingCount();
        if (cancelled) return;
        setPendingSync(before);
        if (before === 0 || !navigator.onLine) return;
        const after = await flushQueue();
        if (cancelled) return;
        setPendingSync(after);
        if (after < before) router.refresh();
      } catch {
        /* IndexedDB non disponibile: ignora */
      }
    }

    sync();
    window.addEventListener("online", sync);
    return () => {
      cancelled = true;
      window.removeEventListener("online", sync);
    };
  }, [router, setPendingSync]);

  return null;
}
