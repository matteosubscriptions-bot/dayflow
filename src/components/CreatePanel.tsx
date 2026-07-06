"use client";

import { useState } from "react";

const KINDS = [
  { id: "SOCIAL", label: "Post social" },
  { id: "EMAIL", label: "Email" },
  { id: "ARTICLE", label: "Articolo" },
  { id: "SPEECH", label: "Speech" },
] as const;

type Kind = (typeof KINDS)[number]["id"];

interface Props {
  noteId: string;
  initialGenerations: { kind: string; content: string }[];
}

/** Sezione CREA: trasforma la nota in un contenuto pronto da pubblicare. */
export function CreatePanel({ noteId, initialGenerations }: Props) {
  const [contents, setContents] = useState<Partial<Record<Kind, string>>>(
    Object.fromEntries(initialGenerations.map((g) => [g.kind, g.content])),
  );
  const [active, setActive] = useState<Kind | null>(
    (initialGenerations[0]?.kind as Kind) ?? null,
  );
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generate(kind: Kind) {
    setActive(kind);
    if (contents[kind]) return; // già generato: mostra; "Rigenera" per rifare
    await regenerate(kind);
  }

  async function regenerate(kind: Kind) {
    setBusy(true);
    try {
      const res = await fetch(`/api/notes/${noteId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      if (res.ok) {
        const data = (await res.json()) as { content: string };
        setContents((c) => ({ ...c, [kind]: data.content }));
      }
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!active || !contents[active]) return;
    await navigator.clipboard.writeText(contents[active]!);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const activeLabel = KINDS.find((k) => k.id === active)?.label;

  return (
    <section className="framed">
      <h2 className="label">Crea</h2>
      <p className="mt-3 text-muted">
        Trasforma questa nota in un contenuto pronto da pubblicare.
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        {KINDS.map((k) => (
          <button
            key={k.id}
            onClick={() => generate(k.id)}
            disabled={busy}
            className={`pill pill-sm ${active === k.id ? "bg-ink text-paper" : ""}`}
          >
            {k.label}
          </button>
        ))}
      </div>

      {active ? (
        <div className="mt-6 border-t border-ink/15 pt-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h3 className="label-muted">{activeLabel}</h3>
            <div className="flex gap-4">
              <button
                onClick={copy}
                disabled={!contents[active]}
                className="font-mono text-xs uppercase tracking-[0.2em] hover:underline disabled:opacity-40"
              >
                {copied ? "Copiato ✓" : "Copia"}
              </button>
              <button
                onClick={() => regenerate(active)}
                disabled={busy}
                className="font-mono text-xs uppercase tracking-[0.2em] hover:underline disabled:opacity-40"
              >
                Rigenera
              </button>
            </div>
          </div>
          {busy && !contents[active] ? (
            <p className="italic text-muted">Genero il contenuto…</p>
          ) : contents[active] ? (
            <p className="whitespace-pre-wrap leading-relaxed">
              {contents[active]}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-5 italic text-muted">Scegli un formato per generare.</p>
      )}
    </section>
  );
}
