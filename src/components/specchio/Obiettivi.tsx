// SPECCHIO · Obiettivi di vita: visione → 12 mesi → trimestre, col
// perché profondo. Proprietà di Specchio; Officina li legge soltanto.

"use client";

import { useState } from "react";
import { Btn, Card, Eyebrow, SERIF, inputStyle, type Theme } from "../ui";
import { useAppStore } from "@/store/useAppStore";

const H: Record<string, string> = { vision: "Visione 3–5 anni", "12m": "12 mesi", quarter: "Trimestre" };

export default function Obiettivi({ th }: { th: Theme }) {
  const goals = useAppStore((s) => s.goals);
  const tasks = useAppStore((s) => s.tasks);
  const addGoal = useAppStore((s) => s.addGoal);
  const [g, setG] = useState({ title: "", horizon: "vision", area: "", why: "" });

  const submit = () => {
    if (!g.title.trim()) return;
    addGoal({ title: g.title.trim(), horizon: g.horizon, area: g.area || null, whyDeep: g.why || null });
    setG({ title: "", horizon: "vision", area: "", why: "" });
  };

  return (
    <div>
      <Card th={th} style={{ marginBottom: 12 }}>
        <Eyebrow th={th}>Nuovo obiettivo di vita — Officina lo leggerà, in sola lettura</Eyebrow>
        <input
          value={g.title}
          onChange={(e) => setG({ ...g, title: e.target.value })}
          placeholder="Titolo…"
          style={{ ...inputStyle(th), marginBottom: 8 }}
        />
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <select value={g.horizon} onChange={(e) => setG({ ...g, horizon: e.target.value })} style={{ ...inputStyle(th), flex: 1 }}>
            {Object.entries(H).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <input
            value={g.area}
            onChange={(e) => setG({ ...g, area: e.target.value })}
            placeholder="Area di vita"
            style={{ ...inputStyle(th), flex: 1 }}
          />
        </div>
        <textarea
          value={g.why}
          onChange={(e) => setG({ ...g, why: e.target.value })}
          rows={2}
          placeholder="Il perché profondo…"
          style={{ ...inputStyle(th), resize: "none" }}
        />
        <Btn th={th} small style={{ marginTop: 8 }} onClick={submit}>Aggiungi</Btn>
      </Card>

      {(["vision", "12m", "quarter"] as const).map((h) => {
        const gs = goals.filter((x) => x.horizon === h && x.isActive);
        if (!gs.length) return null;
        return (
          <div key={h} style={{ marginBottom: 12 }}>
            <Eyebrow th={th}>{H[h]}</Eyebrow>
            {gs.map((x) => {
              const nTasks = tasks.filter((t) => t.supportsGoalId === x.id && t.status !== "archived").length;
              return (
                <Card th={th} key={x.id} style={{ marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, color: th.ink }}>🎯 {x.title}</div>
                  {x.area && <div style={{ fontSize: 12, color: th.accent }}>{x.area}</div>}
                  {x.whyDeep && (
                    <div style={{ fontSize: 13, color: th.sub, fontStyle: "italic", marginTop: 4, fontFamily: SERIF }}>
                      {x.whyDeep}
                    </div>
                  )}
                  {nTasks > 0 && (
                    <div style={{ fontSize: 12, color: th.sub, marginTop: 4 }}>{nTasks} task in Officina lo sostengono</div>
                  )}
                </Card>
              );
            })}
          </div>
        );
      })}
      {!goals.filter((x) => x.isActive).length && (
        <div style={{ color: th.sub, fontSize: 14, textAlign: "center", padding: 20, fontFamily: SERIF }}>
          Gli obiettivi di vita sono identità, non produttività. Inizia dalla visione.
        </div>
      )}
    </div>
  );
}
