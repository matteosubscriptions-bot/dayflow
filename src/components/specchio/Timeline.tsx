// SPECCHIO · Timeline: il viaggio — check-in, gratitudini, tratti emersi,
// dialoghi e obiettivi in una vista longitudinale. Con la review
// settimanale su richiesta (specchio, non pagella).

"use client";

import { useMemo, useState } from "react";
import { Btn, Card, Eyebrow, SERIF, type Theme } from "../ui";
import { useAppStore } from "@/store/useAppStore";

type Entry = { date: string; time?: string; kind: string; text: string; serif?: boolean };

export default function Timeline({ th }: { th: Theme }) {
  const moods = useAppStore((s) => s.moods);
  const traits = useAppStore((s) => s.traits);
  const dialogues = useAppStore((s) => s.dialogues);
  const goals = useAppStore((s) => s.goals);
  const [review, setReview] = useState<{ narrative?: string | null; contentJson?: Record<string, unknown> } | null>(null);
  const [busy, setBusy] = useState(false);

  const entries = useMemo<Entry[]>(() => {
    const es: Entry[] = [];
    for (const m of moods) {
      if (m.label === "gratitudine") {
        es.push({ date: m.date, time: m.time, kind: "Gratitudine", text: m.context || "", serif: true });
      } else if (m.moodIntensity != null || m.energy != null) {
        es.push({
          date: m.date, time: m.time, kind: "Check-in",
          text: `umore ${m.moodIntensity ?? "—"}/5 · energia ${m.energy ?? "—"}/5`,
        });
      }
    }
    for (const t of traits) {
      es.push({ date: t.detectedAt.slice(0, 10), kind: "Nel profilo", text: t.trait, serif: true });
    }
    for (const d of dialogues) {
      const userTurns = d.transcript.filter((t) => t.role === "user").length;
      es.push({ date: d.startedAt.slice(0, 10), kind: "Dialogo", text: `${userTurns} osservazioni${d.insight ? ` — ${d.insight}` : ""}` });
    }
    for (const g of goals) {
      es.push({ date: g.createdAt.slice(0, 10), kind: "Obiettivo di vita", text: `🎯 ${g.title}` });
    }
    return es.sort((a, b) => (b.date + (b.time || "")).localeCompare(a.date + (a.time || ""))).slice(0, 60);
  }, [moods, traits, dialogues, goals]);

  const runReview = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/review");
      setReview(await res.json());
    } catch {
      setReview(null);
    }
    setBusy(false);
  };

  const byDate = useMemo(() => {
    const m = new Map<string, Entry[]>();
    for (const e of entries) {
      if (!m.has(e.date)) m.set(e.date, []);
      m.get(e.date)!.push(e);
    }
    return [...m.entries()];
  }, [entries]);

  return (
    <div>
      <Card th={th} style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Eyebrow th={th}>La settimana allo specchio</Eyebrow>
          <div style={{ flex: 1 }} />
          <Btn th={th} small ghost onClick={runReview} disabled={busy}>
            {busy ? "…" : "Genera review"}
          </Btn>
        </div>
        {review?.contentJson ? (
          <>
            <div style={{ fontSize: 13, color: th.sub }}>
              {String((review.contentJson as Record<string, unknown>).tasksDone)} task fatti ·{" "}
              umore medio {String((review.contentJson as Record<string, unknown>).moodAvg ?? "—")} ·{" "}
              energia media {String((review.contentJson as Record<string, unknown>).energyAvg ?? "—")} ·{" "}
              {String((review.contentJson as Record<string, unknown>).habitCompletions)} spunte abitudini
            </div>
            {review.narrative && (
              <div style={{ fontFamily: SERIF, fontSize: 15, color: th.ink, marginTop: 8, whiteSpace: "pre-wrap" }}>
                {review.narrative}
              </div>
            )}
          </>
        ) : (
          <div style={{ fontSize: 13, color: th.sub }}>Numeri e, se l&apos;AI è attiva, una lettura in poche frasi.</div>
        )}
      </Card>

      {byDate.map(([date, es]) => (
        <div key={date} style={{ marginBottom: 14 }}>
          <Eyebrow th={th}>{date}</Eyebrow>
          {es.map((e, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "6px 0", borderLeft: `2px solid ${th.line}`, paddingLeft: 12, marginLeft: 4 }}>
              <div style={{ minWidth: 92, fontSize: 11, color: th.accent, fontWeight: 700, paddingTop: 2 }}>{e.kind}</div>
              <div style={{ flex: 1, fontSize: 14, color: th.ink, fontFamily: e.serif ? SERIF : "inherit" }}>{e.text}</div>
            </div>
          ))}
        </div>
      ))}
      {!entries.length && (
        <div style={{ color: th.sub, fontSize: 14, textAlign: "center", padding: 20, fontFamily: SERIF }}>
          Il viaggio si disegna da solo, un check-in e un dialogo alla volta.
        </div>
      )}
    </div>
  );
}
