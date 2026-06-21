"use client";

// Pure-CSS animated waveform shown while the mic is listening.
export function Waveform({ active }: { active: boolean }) {
  const bars = [0, 1, 2, 3, 4, 5, 6];
  return (
    <div className="flex h-10 items-center justify-center gap-1" aria-hidden>
      {bars.map((i) => (
        <span
          key={i}
          className={`w-1 rounded-full bg-focus ${active ? "animate-wave" : ""}`}
          style={{
            height: active ? "100%" : "20%",
            animationDelay: `${i * 0.1}s`,
            opacity: active ? 1 : 0.3,
          }}
        />
      ))}
    </div>
  );
}
