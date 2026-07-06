"use client";

import { useAppStore } from "@/store/useAppStore";
import { RecorderPanel } from "@/components/RecorderPanel";

/**
 * Pulsante di registrazione flottante, sempre disponibile in ogni schermata
 * (in basso a sinistra, come nelle schermate di riferimento).
 */
export function FloatingRecorder() {
  const open = useAppStore((s) => s.recorderOpen);
  const openRecorder = useAppStore((s) => s.openRecorder);

  return (
    <>
      {!open ? (
        <button
          onClick={openRecorder}
          aria-label="Registra una nota vocale"
          className="fixed bottom-6 left-5 z-40 flex items-center gap-3 rounded-full
            bg-ink px-6 py-4 text-paper shadow-xl transition-transform hover:scale-[1.03]"
        >
          <MicIcon className="h-5 w-5" />
          <span className="text-sm font-medium uppercase tracking-widest">
            Registra
          </span>
        </button>
      ) : null}
      {open ? <RecorderPanel /> : null}
    </>
  );
}

export function MicIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5 11a7 7 0 0 0 14 0M12 18v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
