"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

interface AskResponse {
  answer: string | null;
  ai: boolean;
  sources: { id: string; title: string; excerpt: string }[];
}

/** "Chiedi al tuo cervello": domanda libera sull'intero archivio di note. */
export function AskBrain() {
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [response, setResponse] = useState<AskResponse | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!question.trim() || asking) return;
    setAsking(true);
    setResponse(null);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (res.ok) setResponse((await res.json()) as AskResponse);
    } finally {
      setAsking(false);
    }
  }

  return (
    <div>
      <h2 className="font-mono text-xs uppercase tracking-[0.3em] opacity-80">
        Chiedi al tuo cervello
      </h2>
      <p className="mt-4 font-display italic text-3xl leading-snug">
        &ldquo;Che collegamenti ci sono tra le mie note?&rdquo;
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-6 flex items-center gap-3 border-t border-teal-ink/30 pt-6"
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Fai una domanda…"
          className="w-full border-none bg-transparent italic text-teal-ink placeholder:text-teal-ink/60 outline-none"
        />
        <button
          type="submit"
          disabled={asking || !question.trim()}
          aria-label="Chiedi"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-ink/15 transition-colors hover:bg-teal-ink/25 disabled:opacity-40"
        >
          {asking ? "…" : "→"}
        </button>
      </form>

      {response ? (
        <div className="mt-6 animate-fade-in border-t border-teal-ink/30 pt-6">
          {response.answer ? (
            <p className="whitespace-pre-wrap leading-relaxed">{response.answer}</p>
          ) : !response.ai ? (
            <p className="opacity-90">
              Per le risposte serve una ANTHROPIC_API_KEY. Intanto, ecco le note
              più pertinenti alla tua domanda:
            </p>
          ) : (
            <p className="opacity-90">
              Non ho trovato note pertinenti: prova a registrare qualche
              pensiero su questo tema.
            </p>
          )}

          {response.sources.length > 0 ? (
            <ul className="mt-4 flex flex-col gap-2">
              {response.sources.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/note/${s.id}`}
                    className="font-display italic text-lg underline-offset-4 hover:underline"
                  >
                    {s.title}
                  </Link>
                  <span className="opacity-70"> — {s.excerpt}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
