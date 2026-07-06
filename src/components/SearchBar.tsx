"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

interface SearchResult {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  tags: string[];
}

/** Ricerca semantica con scorciatoia ⌘K e pulsante Reindicizza. */
export function SearchBar() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [reindexing, setReindexing] = useState(false);
  const [reindexed, setReindexed] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults(null);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (res.ok) setResults((await res.json()) as SearchResult[]);
    } finally {
      setSearching(false);
    }
  }, []);

  function onChange(value: string) {
    setQ(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 350);
  }

  async function onReindex() {
    setReindexing(true);
    setReindexed(null);
    try {
      const res = await fetch("/api/reindex", { method: "POST" });
      if (res.ok) {
        const data = (await res.json()) as { reindexed: number };
        setReindexed(data.reindexed);
      }
    } finally {
      setReindexing(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="label">Ricerca semantica</h2>
        <button
          onClick={onReindex}
          disabled={reindexing}
          className="font-mono text-xs uppercase tracking-[0.2em] text-muted hover:text-ink disabled:opacity-50"
        >
          {reindexing
            ? "Reindicizzo…"
            : reindexed != null
              ? `${reindexed} note indicizzate`
              : "Reindicizza"}
        </button>
      </div>

      <div className="relative">
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Cerca tra i tuoi pensieri"
          className="w-full border border-ink/25 bg-paper px-4 py-3 pr-14 outline-none focus:border-ink"
        />
        <kbd className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs text-muted">
          ⌘K
        </kbd>
      </div>

      {q.trim() && results ? (
        <ul className="mt-4 flex flex-col divide-y divide-ink/10 border-t border-ink/10">
          {results.length === 0 && !searching ? (
            <li className="py-4 text-sm text-muted">
              Nessuna nota trovata per «{q}».
            </li>
          ) : (
            results.map((r) => (
              <li key={r.id}>
                <Link href={`/note/${r.id}`} className="group flex flex-col gap-1 py-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-display italic text-xl group-hover:underline">
                      {r.title}
                    </span>
                    <span className="label-muted shrink-0">{r.date}</span>
                  </div>
                  <span className="text-sm text-muted">{r.excerpt}</span>
                </Link>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
