// Coda dei grezzi in attesa di elaborazione + coda offline locale.
// Se il router era ambiguo, decide l'utente (mai in silenzio, spec A.2).

"use client";

import { Btn, Card, Eyebrow, type Theme } from "./ui";
import { useAppStore } from "@/store/useAppStore";
import type { CaptureT } from "@/types";

export default function CaptureQueue({
  th, onElaborate,
}: {
  th: Theme;
  onElaborate: (c: CaptureT, domain: string) => void;
}) {
  const captures = useAppStore((s) => s.captures);
  const pendingQueue = useAppStore((s) => s.pendingQueue);
  const busyCaptureId = useAppStore((s) => s.busyCaptureId);
  const pending = captures.filter((c) => c.status === "pending");

  if (!pending.length && !pendingQueue.length) return null;

  const domLabel = (d?: string | null) =>
    d === "specchio" ? "Specchio" : d === "officina-idea" ? "Idea" : "Task";

  return (
    <Card th={th} style={{ marginBottom: 12 }}>
      {pendingQueue.length > 0 && (
        <>
          <Eyebrow th={th}>In attesa di invio (offline) · {pendingQueue.length}</Eyebrow>
          {pendingQueue.map((p, i) => (
            <div key={i} style={{ fontSize: 13, color: th.sub, padding: "4px 0" }}>
              {p.raw.length > 90 ? p.raw.slice(0, 90) + "…" : p.raw}
            </div>
          ))}
        </>
      )}
      {pending.length > 0 && (
        <>
          <Eyebrow th={th}>In attesa di elaborazione · {pending.length}</Eyebrow>
          {pending.map((c) => (
            <div key={c.id} style={{ padding: "8px 0", borderTop: `1px solid ${th.line}` }}>
              <div style={{ fontSize: 14, color: th.ink }}>
                {c.source === "voice" && "🎙 "}
                {c.raw.length > 90 ? c.raw.slice(0, 90) + "…" : c.raw}
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 6, alignItems: "center", flexWrap: "wrap" }}>
                {c.suggested && !c.ambiguous && (
                  <span style={{ fontSize: 12, color: th.sub }}>→ {domLabel(c.suggested)}</span>
                )}
                {c.ambiguous ? (
                  <>
                    <span style={{ fontSize: 12, color: th.sub }}>Dove va?</span>
                    <Btn th={th} small ghost onClick={() => onElaborate(c, "officina-task")}>Task</Btn>
                    <Btn th={th} small ghost onClick={() => onElaborate(c, "officina-idea")}>Idea</Btn>
                    <Btn th={th} small ghost onClick={() => onElaborate(c, "specchio")}>Specchio</Btn>
                  </>
                ) : (
                  <Btn th={th} small onClick={() => onElaborate(c, c.suggested!)} disabled={busyCaptureId === c.id}>
                    {busyCaptureId === c.id ? "Elaboro…" : "Elabora"}
                  </Btn>
                )}
              </div>
            </div>
          ))}
        </>
      )}
    </Card>
  );
}
