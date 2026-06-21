"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Check-in reminder times are stored locally (client preference).
const DEFAULTS = { morning: "08:00", midday: "13:00", evening: "21:00" };
const KEY = "dayflow.checkinTimes";

export default function CheckinTimesPage() {
  const [times, setTimes] = useState(DEFAULTS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(KEY);
    if (stored) setTimes({ ...DEFAULTS, ...JSON.parse(stored) });
  }, []);

  const save = () => {
    localStorage.setItem(KEY, JSON.stringify(times));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const SLOTS: { key: keyof typeof DEFAULTS; label: string }[] = [
    { key: "morning", label: "Mattina" },
    { key: "midday", label: "Metà giornata" },
    { key: "evening", label: "Sera" },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Link href="/settings" className="btn-ghost text-sm">
        ← Tu
      </Link>
      <h1 className="font-display text-2xl">Orari check-in</h1>

      <div className="flex flex-col gap-3">
        {SLOTS.map((s) => (
          <label key={s.key} className="flex items-center justify-between rounded-card bg-mist p-4">
            <span>{s.label}</span>
            <input
              type="time"
              value={times[s.key]}
              onChange={(e) => setTimes((t) => ({ ...t, [s.key]: e.target.value }))}
              className="rounded-card border border-ink/10 bg-canvas p-2"
            />
          </label>
        ))}
      </div>

      <button type="button" className="btn-primary" onClick={save}>
        {saved ? "Salvato" : "Salva"}
      </button>
    </div>
  );
}
