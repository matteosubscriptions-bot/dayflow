"use client";

import { useCallback, useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";

interface Idea {
  id: string;
  title: string;
  body: string | null;
  project: string | null;
  tags: string | null;
}

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const openQuickCapture = useAppStore((s) => s.openQuickCapture);

  const load = useCallback(async () => {
    const res = await fetch("/api/ideas");
    const data = await res.json();
    setIdeas(data.ideas ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (id: string, action: "to_task" | "archive") => {
    await fetch(`/api/ideas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    void load();
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Idee</h1>
        <button
          type="button"
          className="btn-primary text-sm"
          onClick={() => openQuickCapture("idea")}
        >
          Cattura
        </button>
      </header>

      {loading ? (
        <p className="text-sm text-ink/40">Carico…</p>
      ) : ideas.length ? (
        <ul className="flex flex-col gap-3">
          {ideas.map((idea) => {
            const tags: string[] = idea.tags ? JSON.parse(idea.tags) : [];
            return (
              <li key={idea.id} className="rounded-card bg-mist p-4">
                <p className="font-display text-lg">{idea.title}</p>
                {idea.body && idea.body !== idea.title && (
                  <p className="mt-1 text-sm text-ink/60">{idea.body}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {idea.project && <span className="meta">{idea.project}</span>}
                  {tags.map((t) => (
                    <span key={t} className="rounded-full bg-canvas px-2 py-0.5 text-xs text-ink/50">
                      #{t}
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex gap-3">
                  <button
                    type="button"
                    className="text-sm text-focus"
                    onClick={() => act(idea.id, "to_task")}
                  >
                    Trasforma in task
                  </button>
                  <button
                    type="button"
                    className="text-sm text-ink/40"
                    onClick={() => act(idea.id, "archive")}
                  >
                    Archivia
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-ink/40">
          Nessuna idea ancora. Toccale al volo, prima che svaniscano.
        </p>
      )}
    </div>
  );
}
