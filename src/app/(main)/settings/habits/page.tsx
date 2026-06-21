"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface Habit {
  id: string;
  name: string;
}

export default function HabitsSettingsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [name, setName] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/habits");
    const data = await res.json();
    setHabits(data.habits ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const add = async () => {
    if (!name.trim()) return;
    await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setName("");
    void load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/habits/${id}`, { method: "DELETE" });
    void load();
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Link href="/settings" className="btn-ghost text-sm">
        ← Tu
      </Link>
      <h1 className="font-display text-2xl">Le tue abitudini</h1>
      <p className="text-sm text-ink/50">
        Le spunterai ogni sera. Niente giudizio su quelle non fatte.
      </p>

      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="es. Meditazione, Palestra, Lettura…"
          className="flex-1 rounded-card border border-ink/10 bg-mist p-3 outline-none focus:border-focus"
        />
        <button type="button" className="btn-primary" onClick={add}>
          +
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {habits.map((h) => (
          <li key={h.id} className="flex items-center justify-between rounded-card bg-mist p-3">
            <span>{h.name}</span>
            <button
              type="button"
              className="text-xs text-ink/30 hover:text-attention"
              onClick={() => remove(h.id)}
            >
              Rimuovi
            </button>
          </li>
        ))}
        {habits.length === 0 && (
          <p className="text-sm text-ink/40">Nessuna abitudine ancora.</p>
        )}
      </ul>
    </div>
  );
}
