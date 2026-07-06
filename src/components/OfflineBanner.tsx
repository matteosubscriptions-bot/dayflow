"use client";

import { useOnline } from "@/hooks/useOnline";
import { useAppStore } from "@/store/useAppStore";

export function OfflineBanner() {
  const online = useOnline();
  const pending = useAppStore((s) => s.pendingSync);

  if (online && pending === 0) return null;

  return (
    <div className="mb-6 animate-fade-in border border-line bg-card px-4 py-3 font-mono text-xs uppercase tracking-[0.2em]">
      {!online
        ? "Sei offline — le registrazioni vengono salvate sul dispositivo e sincronizzate al ritorno della connessione."
        : `Sincronizzazione: ${pending} nota${pending > 1 ? "e" : ""} in coda…`}
    </div>
  );
}
