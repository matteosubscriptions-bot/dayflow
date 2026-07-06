"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fullDate, formatDuration } from "@/lib/dates";
import { NoteEditor } from "@/components/NoteEditor";
import { InsightsPanel } from "@/components/InsightsPanel";
import { CreatePanel } from "@/components/CreatePanel";
import { AgentsPanel } from "@/components/AgentsPanel";

export interface NoteData {
  id: string;
  title: string;
  contentHtml: string;
  transcript: string;
  status: "DRAFT" | "READY";
  source: string;
  hasAudio: boolean;
  audioDuration: number | null;
  createdAt: string;
  projectId: string | null;
  summary: string | null;
  keyPoints: string[] | null;
  todos: { text: string; done: boolean }[] | null;
  tags: string[];
  generations: { kind: string; content: string }[];
}

interface Props {
  note: NoteData;
  allTags: string[];
  projects: { id: string; name: string }[];
}

export function NoteDetail({ note, allTags, projects }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(note.title);
  const [contentHtml, setContentHtml] = useState(note.contentHtml);
  const [status, setStatus] = useState(note.status);
  const [tags, setTags] = useState(note.tags);
  const [projectId, setProjectId] = useState(note.projectId);
  const [newTag, setNewTag] = useState("");
  const [addingTag, setAddingTag] = useState(false);
  const [saved, setSaved] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback(
    async (patch: Record<string, unknown>) => {
      setSaved(false);
      await fetch(`/api/notes/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      setSaved(true);
    },
    [note.id],
  );

  // Autosave (debounce) di titolo e contenuto.
  const scheduleSave = useCallback(
    (patch: Record<string, unknown>) => {
      setSaved(false);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => persist(patch), 800);
    },
    [persist],
  );

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  function toggleStatus() {
    const next = status === "DRAFT" ? "READY" : "DRAFT";
    setStatus(next);
    persist({ status: next });
  }

  function toggleTag(name: string) {
    const next = tags.includes(name)
      ? tags.filter((t) => t !== name)
      : [...tags, name];
    setTags(next);
    persist({ tags: next });
  }

  function addTag() {
    const name = newTag.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!name) return;
    setNewTag("");
    setAddingTag(false);
    if (!tags.includes(name)) {
      const next = [...tags, name];
      setTags(next);
      persist({ tags: next });
    }
  }

  async function onDelete() {
    if (!confirm("Eliminare definitivamente questa nota?")) return;
    await fetch(`/api/notes/${note.id}`, { method: "DELETE" });
    router.push("/library");
    router.refresh();
  }

  const otherTags = allTags.filter((t) => !tags.includes(t));

  return (
    <div className="flex flex-col gap-8">
      {/* Barra superiore: libreria, stato, elimina */}
      <div className="flex items-center justify-between gap-3">
        <Link href="/library" className="label-muted hover:text-ink">
          ← Libreria
        </Link>
        <div className="flex items-center gap-4">
          <span className="label-muted hidden sm:inline">
            {saved ? "Salvata" : "Salvo…"}
          </span>
          <button
            onClick={toggleStatus}
            title="Cambia stato"
            className={`label ${status === "DRAFT" ? "" : "text-muted line-through decoration-2"}`}
          >
            {status === "DRAFT" ? "Bozza" : "Pronta"}
          </button>
          <button onClick={onDelete} className="text-sm text-red-700 hover:underline">
            Elimina
          </button>
        </div>
      </div>

      {/* Titolo + data */}
      <div>
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            scheduleSave({ title: e.target.value, contentHtml });
          }}
          className="w-full bg-transparent font-display italic text-4xl leading-tight outline-none sm:text-5xl"
        />
        <p className="label-muted mt-3">Creata {fullDate(note.createdAt)}</p>
      </div>

      {/* Tag + progetto */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => toggleTag(t)}
              title="Rimuovi tag"
              className="tag-chip bg-ink !text-paper border-ink"
            >
              #{t} ×
            </button>
          ))}
          {addingTag ? (
            <input
              autoFocus
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTag()}
              onBlur={addTag}
              placeholder="NUOVOTAG"
              className="w-32 border-b border-ink/40 bg-transparent px-1 font-mono text-xs uppercase tracking-[0.15em] outline-none"
            />
          ) : (
            <button onClick={() => setAddingTag(true)} className="label-muted hover:text-ink">
              + Tag
            </button>
          )}
        </div>
        {otherTags.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="label-muted">Esistenti:</span>
            {otherTags.map((t) => (
              <button key={t} onClick={() => toggleTag(t)} className="tag-chip hover:border-ink">
                #{t}
              </button>
            ))}
          </div>
        ) : null}

        <div className="flex items-center gap-3">
          <span className="label-muted">Progetto:</span>
          <select
            value={projectId ?? ""}
            onChange={(e) => {
              const v = e.target.value || null;
              setProjectId(v);
              persist({ projectId: v });
            }}
            className="border border-ink/25 bg-paper px-3 py-1.5 text-sm outline-none"
          >
            <option value="">— nessuno —</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audio originale */}
      {note.hasAudio ? (
        <section className="framed">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="label">Audio originale</h2>
            <span className="label-muted">
              {formatDuration(note.audioDuration)}
            </span>
          </div>
          <audio controls preload="metadata" className="w-full" src={`/api/notes/${note.id}/audio`} />
        </section>
      ) : null}

      {/* Editor */}
      <section className="framed">
        <NoteEditor
          contentHtml={contentHtml}
          onChange={(html) => {
            setContentHtml(html);
            scheduleSave({ title, contentHtml: html });
          }}
        />
      </section>

      {/* Trascrizione originale (se diversa dal contenuto) */}
      {note.transcript &&
      !note.contentHtml.includes(note.transcript.slice(0, 60)) ? (
        <details className="framed">
          <summary className="label cursor-pointer">
            Trascrizione originale
          </summary>
          <p className="mt-4 whitespace-pre-wrap font-display text-lg leading-relaxed text-muted">
            {note.transcript}
          </p>
        </details>
      ) : null}

      {/* Insights: riassunto, punti chiave, todo */}
      <InsightsPanel
        noteId={note.id}
        initialSummary={note.summary}
        initialKeyPoints={note.keyPoints}
        initialTodos={note.todos}
      />

      {/* Agenti: Pamela, Simone, Corinne */}
      <AgentsPanel noteId={note.id} />

      {/* Crea: post social, email, articolo, speech */}
      <CreatePanel noteId={note.id} initialGenerations={note.generations} />
    </div>
  );
}
