// OFFICINA · Oggi: la rana + al massimo altre tre (Eisenhower/Eat-the-Frog),
// e i pattern proattivi come domande, non giudizi (spec §3.2, §3.3).

"use client";

import { useMemo } from "react";
import { Btn, Card, Eyebrow, type Theme } from "../ui";
import { useAppStore } from "@/store/useAppStore";
import { pickFrog, topThree, stalledProjects, overDeferred, matureIdeasNotTasks } from "@/lib/heuristics";

export default function Oggi({ th, goToIdeas }: { th: Theme; goToIdeas: () => void }) {
  const tasks = useAppStore((s) => s.tasks);
  const projects = useAppStore((s) => s.projects);
  const ideas = useAppStore((s) => s.ideas);
  const links = useAppStore((s) => s.links);
  const goals = useAppStore((s) => s.goals);
  const taskAction = useAppStore((s) => s.taskAction);

  const frog = useMemo(() => pickFrog(tasks), [tasks]);
  const top = useMemo(() => topThree(tasks, frog?.id), [tasks, frog]);
  const now = Date.now();
  const stalled = stalledProjects(projects, now);
  const deferred = overDeferred(tasks).filter((t) => t.id !== frog?.id);
  const mature = matureIdeasNotTasks(ideas, links);
  const goalOf = (id?: string | null) => goals.find((g) => g.id === id);

  return (
    <div>
      {frog ? (
        <Card th={th} style={{ marginBottom: 12, border: `1px solid ${th.accent}`, background: th.accSoft }}>
          <Eyebrow th={th}>🐸 La rana di oggi — falla per prima</Eyebrow>
          <div style={{ fontSize: 17, fontWeight: 700, color: th.ink }}>{frog.title}</div>
          {frog.supportsGoalId && goalOf(frog.supportsGoalId) && (
            <div style={{ fontSize: 12, color: th.sub, marginTop: 4 }}>
              🎯 sostiene «{goalOf(frog.supportsGoalId)!.title}»
            </div>
          )}
          {frog.deferredCount >= 3 && (
            <div style={{ fontSize: 13, color: th.danger, marginTop: 4 }}>
              Spostata {frog.deferredCount} volte — è ancora il tuo obiettivo?
            </div>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <Btn th={th} small onClick={() => taskAction(frog.id, "done")}>Fatta ✓</Btn>
            <Btn th={th} small ghost onClick={() => taskAction(frog.id, "defer")}>Rimanda</Btn>
          </div>
        </Card>
      ) : (
        <Card th={th} style={{ marginBottom: 12 }}>
          <div style={{ color: th.sub, fontSize: 14 }}>
            Nessun task aperto. Cattura qualcosa col tasto ＋ o aggiungi un task da Progetti.
          </div>
        </Card>
      )}

      {top.length > 0 && (
        <Card th={th} style={{ marginBottom: 12 }}>
          <Eyebrow th={th}>Poi, al massimo altre {top.length}</Eyebrow>
          {top.map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderTop: `1px solid ${th.line}` }}>
              <div style={{ flex: 1, fontSize: 15, color: th.ink }}>
                {t.title}
                {t.supportsGoalId ? <span style={{ fontSize: 11, color: th.sub }}> · 🎯</span> : null}
              </div>
              <Btn th={th} small ghost onClick={() => taskAction(t.id, "done")}>✓</Btn>
              <Btn th={th} small ghost onClick={() => taskAction(t.id, "defer")} title="Rimanda">↻</Btn>
            </div>
          ))}
        </Card>
      )}

      {(stalled.length > 0 || deferred.length > 0 || mature.length > 0) && (
        <Card th={th} style={{ marginBottom: 12 }}>
          <Eyebrow th={th}>Domande, non giudizi</Eyebrow>
          {stalled.map((p) => (
            <div key={p.id} style={{ fontSize: 14, color: th.ink, padding: "4px 0" }}>
              «{p.name}» è fermo da più di una settimana — è ancora prioritario?
            </div>
          ))}
          {deferred.map((t) => (
            <div key={t.id} style={{ fontSize: 14, color: th.ink, padding: "4px 0" }}>
              «{t.title}» spostato {t.deferredCount} volte — è ancora il tuo obiettivo?
            </div>
          ))}
          {mature.length > 0 && (
            <div style={{ fontSize: 14, color: th.ink, padding: "4px 0" }}>
              {mature.length === 1 ? "Un'idea matura non è" : `${mature.length} idee mature non sono`} ancora
              diventate task —{" "}
              <button
                onClick={goToIdeas}
                style={{ background: "transparent", border: "none", color: th.accent, padding: 0, fontSize: 14, textDecoration: "underline" }}
              >
                ne scegli una?
              </button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
