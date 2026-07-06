"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Project {
  id: string;
  name: string;
  description: string | null;
  noteCount: number;
}

export function ProjectsManager({ initialProjects }: { initialProjects: Project[] }) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      if (res.ok) {
        const p = (await res.json()) as Project;
        setProjects((list) => [...list, { ...p, noteCount: 0 }]);
        setName("");
        setDescription("");
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function onRename(id: string) {
    const trimmed = editName.trim();
    setEditing(null);
    if (!trimmed) return;
    setProjects((list) =>
      list.map((p) => (p.id === id ? { ...p, name: trimmed } : p)),
    );
    await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    router.refresh();
  }

  async function onDelete(id: string) {
    if (
      !confirm(
        "Eliminare il progetto? Le note restano nella libreria, senza progetto.",
      )
    )
      return;
    setProjects((list) => list.filter((p) => p.id !== id));
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="mt-8 flex flex-col gap-6">
      <form onSubmit={onCreate} className="framed flex flex-col gap-4">
        <h2 className="label">Nuovo progetto</h2>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome del progetto"
          className="border border-ink/25 bg-paper px-4 py-3 outline-none focus:border-ink"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrizione (opzionale)"
          className="border border-ink/25 bg-paper px-4 py-3 outline-none focus:border-ink"
        />
        <button type="submit" disabled={busy || !name.trim()} className="pill-solid self-start">
          Crea progetto
        </button>
      </form>

      {projects.length === 0 ? (
        <p className="italic text-muted">Nessun progetto ancora.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {projects.map((p) => (
            <li key={p.id} className="framed">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  {editing === p.id ? (
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && onRename(p.id)}
                      onBlur={() => onRename(p.id)}
                      className="w-full border-b border-ink/40 bg-transparent font-display italic text-2xl outline-none"
                    />
                  ) : (
                    <Link
                      href={`/library?project=${p.id}`}
                      className="font-display italic text-2xl hover:underline"
                    >
                      ◈ {p.name}
                    </Link>
                  )}
                  {p.description ? (
                    <p className="mt-1 text-muted">{p.description}</p>
                  ) : null}
                  <p className="label-muted mt-2">
                    {p.noteCount} not{p.noteCount === 1 ? "a" : "e"}
                  </p>
                </div>
                <div className="flex shrink-0 gap-3">
                  <button
                    onClick={() => {
                      setEditing(p.id);
                      setEditName(p.name);
                    }}
                    className="font-mono text-xs uppercase tracking-[0.15em] text-muted hover:text-ink"
                  >
                    Rinomina
                  </button>
                  <button
                    onClick={() => onDelete(p.id)}
                    className="font-mono text-xs uppercase tracking-[0.15em] text-red-700 hover:underline"
                  >
                    Elimina
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
