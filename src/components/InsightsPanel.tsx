"use client";

import { useState } from "react";

type Todo = { text: string; done: boolean };

interface Props {
  noteId: string;
  initialSummary: string | null;
  initialKeyPoints: string[] | null;
  initialTodos: Todo[] | null;
}

const EMPTY = <p className="italic text-muted">— vuoto —</p>;

/** Sezione INSIGHTS: Riassumi / Estrai punti chiave / Crea todo list. */
export function InsightsPanel({
  noteId,
  initialSummary,
  initialKeyPoints,
  initialTodos,
}: Props) {
  const [summary, setSummary] = useState(initialSummary);
  const [keyPoints, setKeyPoints] = useState(initialKeyPoints);
  const [todos, setTodos] = useState(initialTodos);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(kind: "summary" | "keypoints" | "todos") {
    setBusy(kind);
    setError(null);
    try {
      const res = await fetch(`/api/notes/${noteId}/insights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Operazione non riuscita");
      }
      const data = (await res.json()) as {
        summary?: string;
        keyPoints?: string[];
        todos?: Todo[];
      };
      if (kind === "summary" && data.summary != null) setSummary(data.summary);
      if (kind === "keypoints" && data.keyPoints != null) setKeyPoints(data.keyPoints);
      if (kind === "todos" && data.todos != null) setTodos(data.todos);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Operazione non riuscita");
    } finally {
      setBusy(null);
    }
  }

  function toggleTodo(index: number) {
    if (!todos) return;
    const next = todos.map((t, i) => (i === index ? { ...t, done: !t.done } : t));
    setTodos(next);
    fetch(`/api/notes/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ todos: next }),
    });
  }

  return (
    <section className="framed">
      <h2 className="label">Insights</h2>

      <div className="mt-5 flex flex-wrap gap-3">
        <button onClick={() => run("summary")} disabled={busy !== null} className="pill pill-sm">
          {busy === "summary" ? "Riassumo…" : "Riassumi"}
        </button>
        <button onClick={() => run("keypoints")} disabled={busy !== null} className="pill pill-sm">
          {busy === "keypoints" ? "Estraggo…" : "Estrai punti chiave"}
        </button>
        <button onClick={() => run("todos")} disabled={busy !== null} className="pill pill-sm">
          {busy === "todos" ? "Creo…" : "Crea todo list"}
        </button>
      </div>

      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

      <div className="mt-6 border-t border-ink/15 pt-6">
        <h3 className="label-muted">Riassunto</h3>
        <div className="mt-3">
          {summary ? (
            <p className="font-display text-lg leading-relaxed">{summary}</p>
          ) : (
            EMPTY
          )}
        </div>
      </div>

      <div className="mt-6 border-t border-ink/15 pt-6">
        <h3 className="label-muted">Punti chiave</h3>
        <div className="mt-3">
          {keyPoints && keyPoints.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {keyPoints.map((p, i) => (
                <li key={i} className="flex gap-3 font-display text-lg leading-snug">
                  <span className="text-muted">—</span> {p}
                </li>
              ))}
            </ul>
          ) : (
            EMPTY
          )}
        </div>
      </div>

      <div className="mt-6 border-t border-ink/15 pt-6">
        <h3 className="label-muted">Todo</h3>
        <div className="mt-3">
          {todos && todos.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {todos.map((t, i) => (
                <li key={i}>
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={t.done}
                      onChange={() => toggleTodo(i)}
                      className="mt-1.5 h-4 w-4 accent-ink"
                    />
                    <span
                      className={`font-display text-lg leading-snug ${t.done ? "text-muted line-through" : ""}`}
                    >
                      {t.text}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            EMPTY
          )}
        </div>
      </div>
    </section>
  );
}
