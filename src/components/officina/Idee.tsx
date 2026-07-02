// OFFICINA · Idee: l'incubatore. Maturità, cluster per tema, collegamenti
// nel grafo, quattro agenti (Creatività, Laterale, Systems, Design) e il
// passaggio idea→task che chiude il cerchio (spec §3.1).

"use client";

import { useMemo, useState } from "react";
import { Btn, Card, Eyebrow, type Theme } from "../ui";
import { useAppStore } from "@/store/useAppStore";
import { clusterByTheme } from "@/lib/heuristics";

const MAT: Record<string, string> = { raw: "grezza", developing: "in sviluppo", mature: "matura" };
const NEXT: Record<string, string> = { raw: "developing", developing: "mature", mature: "raw" };
const AGENTS = [
  ["creativita", "Creatività"],
  ["laterale", "Laterale"],
  ["systems", "Systems"],
  ["design", "Design"],
] as const;

export default function Idee({ th }: { th: Theme }) {
  const ideas = useAppStore((s) => s.ideas);
  const links = useAppStore((s) => s.links);
  const patchIdea = useAppStore((s) => s.patchIdea);
  const ideaBecomeTask = useAppStore((s) => s.ideaBecomeTask);
  const runIdeaAgent = useAppStore((s) => s.runIdeaAgent);

  const [busy, setBusy] = useState<string | null>(null);
  const [agentsFor, setAgentsFor] = useState<string | null>(null);
  const [themeFilter, setThemeFilter] = useState<string | null>(null);

  const clusters = useMemo(() => clusterByTheme(ideas), [ideas]);
  const relatedCount = (id: string) =>
    links.filter((l) => (l.fromId === id || l.toId === id) && l.relation !== "from_capture").length;
  const becameTask = (id: string) =>
    links.some((l) => l.fromId === id && l.relation === "became_task");

  const shown = themeFilter
    ? ideas.filter((i) => (i.theme || "").toLowerCase() === themeFilter)
    : ideas;

  const run = async (ideaId: string, agent: string) => {
    setBusy(ideaId + agent);
    await runIdeaAgent(ideaId, agent);
    setBusy(null);
  };

  return (
    <div>
      {clusters.length > 0 && (
        <Card th={th} style={{ marginBottom: 12 }}>
          <Eyebrow th={th}>Cluster per tema</Eyebrow>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {themeFilter && (
              <button
                onClick={() => setThemeFilter(null)}
                style={{ fontSize: 12, border: "none", background: th.accent, color: th.dark ? "#14161F" : "#FBFAF6", borderRadius: 999, padding: "4px 10px", fontWeight: 600 }}
              >
                ✕ {themeFilter}
              </button>
            )}
            {clusters
              .filter(([k]) => k !== themeFilter)
              .map(([theme, group]) => (
                <button
                  key={theme}
                  onClick={() => setThemeFilter(theme)}
                  style={{ fontSize: 12, border: `1px solid ${th.line}`, background: "transparent", color: th.ink, borderRadius: 999, padding: "4px 10px" }}
                >
                  #{theme} · {group.length}
                </button>
              ))}
          </div>
        </Card>
      )}

      {shown.map((i) => (
        <Card th={th} key={i.id} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
            <div style={{ flex: 1, fontWeight: 700, color: th.ink }}>{i.title}</div>
            <button
              onClick={() => patchIdea(i.id, { maturity: NEXT[i.maturity] })}
              title="Cambia maturità"
              style={{ fontSize: 11, border: `1px solid ${th.line}`, background: "transparent", color: th.sub, borderRadius: 999, padding: "3px 9px" }}
            >
              {MAT[i.maturity]}
            </button>
          </div>
          {i.body && (
            <div style={{ fontSize: 13, color: th.sub, marginTop: 6, whiteSpace: "pre-wrap" }}>{i.body}</div>
          )}
          <div style={{ display: "flex", gap: 6, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
            {i.theme && (
              <button
                onClick={() => setThemeFilter((i.theme || "").toLowerCase())}
                style={{ fontSize: 11, color: th.accent, background: "transparent", border: "none", padding: 0 }}
              >
                #{i.theme}
              </button>
            )}
            {relatedCount(i.id) > 0 && (
              <span style={{ fontSize: 11, color: th.sub }}>{relatedCount(i.id)} collegamenti</span>
            )}
            {becameTask(i.id) && <span style={{ fontSize: 11, color: th.good }}>→ già task</span>}
            <div style={{ flex: 1 }} />
            <Btn th={th} small ghost onClick={() => setAgentsFor(agentsFor === i.id ? null : i.id)}>
              Sviluppa (AI) {agentsFor === i.id ? "▾" : "▸"}
            </Btn>
            {i.maturity === "mature" && !becameTask(i.id) && (
              <Btn th={th} small onClick={() => ideaBecomeTask(i)}>→ Task</Btn>
            )}
          </div>
          {agentsFor === i.id && (
            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              {AGENTS.map(([key, label]) => (
                <Btn key={key} th={th} small ghost disabled={busy === i.id + key} onClick={() => run(i.id, key)}>
                  {busy === i.id + key ? "…" : label}
                </Btn>
              ))}
            </div>
          )}
        </Card>
      ))}
      {!shown.length && (
        <div style={{ color: th.sub, fontSize: 14, textAlign: "center", padding: 20 }}>
          {themeFilter ? "Nessuna idea con questo tema." : "L'incubatore è vuoto. Cattura uno spunto col tasto ＋."}
        </div>
      )}
    </div>
  );
}
