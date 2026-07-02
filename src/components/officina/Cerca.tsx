// OFFICINA · Cerca: ricerca trasversale server-side su idee, task,
// grezzi, progetti e obiettivi.

"use client";

import { useEffect, useRef, useState } from "react";
import { Eyebrow, inputStyle, type Theme } from "../ui";

type Hit = { kind: string; id: string; text: string; sub?: string };

export default function Cerca({ th }: { th: Theme }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [searching, setSearching] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(timer.current);
    if (!q.trim()) { setHits([]); return; }
    timer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
        const data = await res.json();
        setHits(data.results || []);
      } catch {
        setHits([]);
      }
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer.current);
  }, [q]);

  return (
    <div>
      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Cerca in idee, task, grezzi, progetti, obiettivi…"
        style={{ ...inputStyle(th), background: th.panel, borderRadius: 12, padding: 12 }}
      />
      <div style={{ marginTop: 12 }}>
        {searching && <div style={{ color: th.sub, fontSize: 13, padding: 8 }}>Cerco…</div>}
        {!searching && hits.length > 0 && <Eyebrow th={th}>{hits.length} risultati</Eyebrow>}
        {hits.map((h) => (
          <div key={h.kind + h.id} style={{ padding: "10px 0", borderBottom: `1px solid ${th.line}` }}>
            <span style={{ fontSize: 11, color: th.accent, fontWeight: 700 }}>
              {h.kind}
              {h.sub ? <span style={{ color: th.sub, fontWeight: 400 }}> · {h.sub}</span> : null}
            </span>
            <div style={{ fontSize: 14, color: th.ink }}>{h.text}</div>
          </div>
        ))}
        {q.trim() && !searching && !hits.length && (
          <div style={{ color: th.sub, fontSize: 14, padding: 12 }}>Nessun risultato per «{q}».</div>
        )}
      </div>
    </div>
  );
}
