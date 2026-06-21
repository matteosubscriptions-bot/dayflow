"use client";

import { useCallback, useEffect, useState } from "react";

interface Routine {
  id: string;
  name: string;
  targetSlot: string | null;
  durationMin: number | null;
}

const SLOTS = [
  { value: "morning", label: "Mattina" },
  { value: "midday", label: "Giornata" },
  { value: "evening", label: "Sera" },
];

export default function RoutinesPage() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [name, setName] = useState("");
  const [slot, setSlot] = useState("morning");
  const [done, setDone] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    const res = await fetch("/api/routines");
    const data = await res.json();
    setRoutines(data.routines ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const add = async () => {
    if (!name.trim()) return;
    await fetch("/api/routines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, targetSlot: slot }),
    });
    setName("");
    void load();
  };

  const toggle = async (id: string) => {
    const next = !done[id];
    setDone((d) => ({ ...d, [id]: next }));
    await fetch(`/api/routines/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: next }),
    });
  };

  const remove = async (id: string) => {
    await fetch(`/api/routines/${id}`, { method: "DELETE" });
    void load();
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <h1 className="font-display text-3xl">Routine</h1>

      <div className="flex flex-col gap-2 rounded-card bg-mist p-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nuova routine…"
          className="rounded-card border border-ink/10 bg-canvas p-3 outline-none focus:border-focus"
        />
        <div className="flex gap-2">
          {SLOTS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setSlot(s.value)}
              className={`flex-1 rounded-card border py-2 text-sm ${
                slot === s.value ? "border-focus bg-focus/10" : "border-ink/10"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <button type="button" className="btn-primary" onClick={add}>
          Aggiungi
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {routines.map((r) => (
          <li key={r.id} className="flex items-center gap-3 rounded-card bg-mist p-3">
            <button
              type="button"
              onClick={() => toggle(r.id)}
              aria-label="Segna fatta oggi"
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                done[r.id] ? "border-achieved bg-achieved text-white" : "border-ink/20"
              }`}
            >
              {done[r.id] && "✓"}
            </button>
            <div className="flex-1">
              <p className="text-sm">{r.name}</p>
              <p className="meta">
                {SLOTS.find((s) => s.value === r.targetSlot)?.label ?? "—"}
                {r.durationMin ? ` · ${r.durationMin}min` : ""}
              </p>
            </div>
            <button
              type="button"
              className="text-xs text-ink/30 hover:text-attention"
              onClick={() => remove(r.id)}
            >
              Rimuovi
            </button>
          </li>
        ))}
        {routines.length === 0 && (
          <p className="text-sm text-ink/40">Nessuna routine ancora.</p>
        )}
      </ul>
    </div>
  );
}
