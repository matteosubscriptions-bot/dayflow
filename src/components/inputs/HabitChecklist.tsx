"use client";

import { useState } from "react";
import type { HabitLog } from "@/types";

// Evening habit checklist — simple toggles, no judgement on unchecked (spec §11).
export function HabitChecklist({
  habits,
  onConfirm,
  onSkip,
  showSkip,
}: {
  habits: { id: string; name: string }[];
  onConfirm: (logs: HabitLog[]) => void;
  onSkip?: () => void;
  showSkip?: boolean;
}) {
  const [done, setDone] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setDone((d) => ({ ...d, [id]: !d[id] }));

  const confirm = () => {
    onConfirm(habits.map((h) => ({ habitId: h.id, name: h.name, done: Boolean(done[h.id]) })));
  };

  if (habits.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-ink/60">
          Non hai ancora una lista di abitudini. Aggiungile dalle impostazioni per
          spuntarle ogni sera.
        </p>
        <button type="button" className="btn-primary" onClick={() => onConfirm([])}>
          Continua
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {habits.map((h) => {
        const checked = Boolean(done[h.id]);
        return (
          <button
            key={h.id}
            type="button"
            onClick={() => toggle(h.id)}
            className={`flex items-center justify-between rounded-card border p-4 text-left transition-colors ${
              checked ? "border-achieved bg-achieved/10" : "border-ink/10 bg-canvas"
            }`}
          >
            <span>{h.name}</span>
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                checked ? "border-achieved bg-achieved text-white" : "border-ink/20"
              }`}
            >
              {checked && (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </span>
          </button>
        );
      })}
      <div className="ml-auto flex items-center gap-4">
        {showSkip && onSkip && (
          <button type="button" className="btn-ghost text-sm" onClick={onSkip}>
            Salta
          </button>
        )}
        <button type="button" className="btn-primary" onClick={confirm}>
          Conferma
        </button>
      </div>
    </div>
  );
}
