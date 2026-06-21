"use client";

import { useEffect, useRef, useState } from "react";
import type { MoodSelection } from "@/types";

export interface MoodPickerProps {
  onSelect: (mood: MoodSelection) => void;
  showEnergy?: boolean;
  compact?: boolean;
  autoConfirm?: boolean;
}

const MOODS = [
  { intensity: 1, emoji: "😔", label: "Molto giù", color: "var(--mood-1)" },
  { intensity: 2, emoji: "😕", label: "Giù", color: "var(--mood-2)" },
  { intensity: 3, emoji: "😐", label: "Neutro", color: "var(--mood-3)" },
  { intensity: 4, emoji: "🙂", label: "Bene", color: "var(--mood-4)" },
  { intensity: 5, emoji: "😊", label: "Ottimo", color: "var(--mood-5)" },
];

/**
 * 5 mood emoji + a separate 1-10 energy slider (spec §8). Auto-confirms
 * 1.5s after a selection unless disabled.
 */
export function MoodPicker({
  onSelect,
  showEnergy = true,
  compact = false,
  autoConfirm = true,
}: MoodPickerProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [energy, setEnergy] = useState(5);
  const [popKey, setPopKey] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const confirm = (intensity: number, en: number) => {
    const mood = MOODS.find((m) => m.intensity === intensity)!;
    onSelect({ emoji: mood.emoji, label: mood.label, intensity, energy: en });
  };

  const handleSelect = (intensity: number) => {
    setSelected(intensity);
    setPopKey((k) => k + 1);
    if (!autoConfirm) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => confirm(intensity, energy), 1500);
  };

  // Re-arm auto-confirm when energy changes after a mood is chosen.
  useEffect(() => {
    if (selected == null || !autoConfirm) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => confirm(selected, energy), 1500);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [energy, selected]);

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className={`flex items-center justify-center ${compact ? "gap-2" : "gap-3"}`}>
        {MOODS.map((m) => {
          const isActive = selected === m.intensity;
          return (
            <button
              key={m.intensity}
              type="button"
              onClick={() => handleSelect(m.intensity)}
              aria-label={m.label}
              aria-pressed={isActive}
              className={`flex flex-col items-center gap-1 rounded-card p-2 transition-all ${
                isActive ? "scale-110" : "opacity-60 hover:opacity-100"
              }`}
            >
              <span
                key={isActive ? popKey : undefined}
                className={`${compact ? "text-3xl" : "text-4xl"} ${isActive ? "animate-pop" : ""}`}
              >
                {m.emoji}
              </span>
              {!compact && (
                <span className="text-xs text-ink/50">{m.label}</span>
              )}
            </button>
          );
        })}
      </div>

      {showEnergy && (
        <div className="w-full max-w-xs">
          <div className="mb-2 flex items-center justify-between">
            <span className="meta">Energia</span>
            <span className="meta">{energy}/10</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={energy}
            onChange={(e) => setEnergy(Number(e.target.value))}
            className="w-full accent-focus"
          />
        </div>
      )}

      {selected != null && !autoConfirm && (
        <button type="button" className="btn-primary" onClick={() => confirm(selected, energy)}>
          Conferma
        </button>
      )}
    </div>
  );
}
