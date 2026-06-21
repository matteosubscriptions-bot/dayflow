"use client";

// Discreet dot-based progress indicator (spec §8 — no numbers).
export function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center justify-center gap-2" aria-label={`Passo ${current + 1} di ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-all ${
            i === current ? "w-6 bg-focus" : i < current ? "w-1.5 bg-focus/40" : "w-1.5 bg-ink/15"
          }`}
        />
      ))}
    </div>
  );
}
