// OFFICINA · Progetti: stato, task ordinati per priorità, e il ponte
// verso gli obiettivi di vita di SPECCHIO (sola lettura, spec §1).

"use client";

import { useState } from "react";
import { Btn, Card, Eyebrow, inputStyle, type Theme } from "../ui";
import { useAppStore } from "@/store/useAppStore";
import { eisenhowerSort } from "@/lib/heuristics";

export default function Progetti({ th }: { th: Theme }) {
  const projects = useAppStore((s) => s.projects);
  const tasks = useAppStore((s) => s.tasks);
  const goals = useAppStore((s) => s.goals);
  const addProject = useAppStore((s) => s.addProject);
  const patchProject = useAppStore((s) => s.patchProject);
  const addTask = useAppStore((s) => s.addTask);
  const taskAction = useAppStore((s) => s.taskAction);

  const [name, setName] = useState("");
  const [openP, setOpenP] = useState<string | null>(null);
  const [nt, setNt] = useState({ title: "", urgency: 3, importance: 3, goal: "" });
  const activeGoals = goals.filter((g) => g.isActive);
  const visible = projects.filter((p) => p.status !== "dropped");

  const submitProject = () => {
    if (!name.trim()) return;
    addProject(name.trim());
    setName("");
  };

  const submitTask = (pid: string) => {
    if (!nt.title.trim()) return;
    addTask({
      title: nt.title.trim(),
      projectId: pid,
      urgency: +nt.urgency,
      importance: +nt.importance,
      supportsGoalId: nt.goal || null,
    });
    setNt({ title: "", urgency: 3, importance: 3, goal: "" });
  };

  return (
    <div>
      <Card th={th} style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitProject()}
            placeholder="Nuovo progetto…"
            style={{ ...inputStyle(th), flex: 1 }}
          />
          <Btn th={th} onClick={submitProject}>+</Btn>
        </div>
      </Card>

      {visible.map((p) => {
        const ts = tasks.filter((t) => t.projectId === p.id && t.status !== "archived");
        const open = ts.filter((t) => t.status === "todo").length;
        const isOpen = openP === p.id;
        return (
          <Card th={th} key={p.id} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => setOpenP(isOpen ? null : p.id)}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: th.ink }}>
                  {p.name}
                  {p.status === "paused" && <span style={{ fontSize: 11, color: th.sub }}> · in pausa</span>}
                </div>
                <div style={{ fontSize: 12, color: th.sub }}>{open} task aperti · {ts.length - open} fatti</div>
              </div>
              <span style={{ color: th.sub }}>{isOpen ? "▾" : "▸"}</span>
            </div>
            {isOpen && (
              <div style={{ marginTop: 10, borderTop: `1px solid ${th.line}`, paddingTop: 10 }}>
                {eisenhowerSort(ts).map((t) => (
                  <div key={t.id} style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 0" }}>
                    <div
                      style={{
                        flex: 1, fontSize: 14, color: th.ink,
                        textDecoration: t.status === "done" ? "line-through" : "none",
                        opacity: t.status === "done" ? 0.5 : 1,
                      }}
                    >
                      {t.title}
                      <span style={{ fontSize: 11, color: th.sub }}>
                        {" "}· U{t.urgency} I{t.importance}
                        {t.supportsGoalId ? " · 🎯" : ""}
                        {t.deferredCount >= 3 ? ` · ↻${t.deferredCount}` : ""}
                      </span>
                    </div>
                    {t.status === "todo" && (
                      <Btn th={th} small ghost onClick={() => taskAction(t.id, "done")}>✓</Btn>
                    )}
                  </div>
                ))}
                <div style={{ marginTop: 8 }}>
                  <input
                    value={nt.title}
                    onChange={(e) => setNt({ ...nt, title: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && submitTask(p.id)}
                    placeholder="Nuovo task…"
                    style={inputStyle(th)}
                  />
                  <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <label style={{ fontSize: 12, color: th.sub }}>
                      Urgenza{" "}
                      <input type="range" min="1" max="5" value={nt.urgency} onChange={(e) => setNt({ ...nt, urgency: +e.target.value })} />
                    </label>
                    <label style={{ fontSize: 12, color: th.sub }}>
                      Importanza{" "}
                      <input type="range" min="1" max="5" value={nt.importance} onChange={(e) => setNt({ ...nt, importance: +e.target.value })} />
                    </label>
                  </div>
                  {activeGoals.length > 0 && (
                    <select
                      value={nt.goal}
                      onChange={(e) => setNt({ ...nt, goal: e.target.value })}
                      style={{ ...inputStyle(th), marginTop: 8 }}
                    >
                      <option value="">Sostiene un obiettivo di vita? (letto da Specchio)</option>
                      {activeGoals.map((g) => (
                        <option key={g.id} value={g.id}>🎯 {g.title}</option>
                      ))}
                    </select>
                  )}
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <Btn th={th} small onClick={() => submitTask(p.id)}>Aggiungi task</Btn>
                    <div style={{ flex: 1 }} />
                    <Btn th={th} small ghost onClick={() => patchProject(p.id, { status: p.status === "paused" ? "active" : "paused" })}>
                      {p.status === "paused" ? "Riprendi" : "Pausa"}
                    </Btn>
                  </div>
                </div>
              </div>
            )}
          </Card>
        );
      })}
      {!visible.length && (
        <div style={{ color: th.sub, fontSize: 14, textAlign: "center", padding: 20 }}>
          Nessun progetto. Creane uno qui sopra.
        </div>
      )}
    </div>
  );
}
