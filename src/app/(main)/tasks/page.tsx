"use client";

import { useEffect, useState, useCallback } from "react";

interface Task {
  id: string;
  title: string;
  priority: string;
  status: string;
  deferCount: number;
}

const PRIORITY_COLOR: Record<string, string> = {
  high: "var(--color-attention)",
  medium: "var(--color-focus)",
  low: "var(--color-low)",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/tasks");
    const data = await res.json();
    setTasks(data.tasks ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const add = async () => {
    if (!title.trim()) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    setTitle("");
    void load();
  };

  const act = async (id: string, action: string) => {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    void load();
  };

  const open = tasks.filter((t) => t.status === "todo" || t.status === "deferred");
  const done = tasks.filter((t) => t.status === "done");

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <h1 className="font-display text-3xl">Task</h1>

      <div className="flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Aggiungi un task…"
          className="flex-1 rounded-card border border-ink/10 bg-mist p-3 outline-none focus:border-focus"
        />
        <button type="button" className="btn-primary" onClick={add}>
          +
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-ink/40">Carico…</p>
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {open.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-3 rounded-card bg-mist p-3"
              >
                <button
                  type="button"
                  aria-label="Completa"
                  onClick={() => act(t.id, "complete")}
                  className="h-5 w-5 shrink-0 rounded-full border-2 border-ink/20 hover:border-achieved"
                />
                <span className="flex-1 text-sm">{t.title}</span>
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: PRIORITY_COLOR[t.priority] }}
                  title={t.priority}
                />
                {t.status === "todo" && (
                  <button
                    type="button"
                    className="text-xs text-ink/40 hover:text-ink/70"
                    onClick={() => act(t.id, "defer")}
                  >
                    Rimanda
                  </button>
                )}
                {t.deferCount >= 3 && (
                  <span className="text-xs text-attention" title="Rimandato spesso">
                    ⟳{t.deferCount}
                  </span>
                )}
              </li>
            ))}
            {open.length === 0 && (
              <p className="text-sm text-ink/40">Niente in sospeso. Respira.</p>
            )}
          </ul>

          {done.length > 0 && (
            <div>
              <p className="meta mb-2">Fatti</p>
              <ul className="flex flex-col gap-2">
                {done.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center gap-3 rounded-card bg-achieved/10 p-3 text-sm text-ink/50 line-through"
                  >
                    <button
                      type="button"
                      aria-label="Riapri"
                      onClick={() => act(t.id, "reopen")}
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-achieved text-white"
                    >
                      ✓
                    </button>
                    {t.title}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
