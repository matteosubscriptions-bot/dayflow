// SPECCHIO · Diario: check-in leggero (umore ED energia, separati),
// gratitudine come innesco, abitudini con spunta serale. Nei momenti
// bassi i numeri si fanno da parte (spec §7).

"use client";

import { useState } from "react";
import { Btn, Card, Eyebrow, SERIF, inputStyle, type Theme } from "../ui";
import { useAppStore } from "@/store/useAppStore";

const oggi = () => new Date().toISOString().slice(0, 10);
const MOOD_LABELS = ["molto giù", "giù", "neutro", "bene", "molto bene"];
const ENERGY_LABELS = ["esaurita", "bassa", "media", "buona", "piena"];

export default function Diario({ th, openDialogue }: { th: Theme; openDialogue: (seed?: string) => void }) {
  const moods = useAppStore((s) => s.moods);
  const habits = useAppStore((s) => s.habits);
  const habitLogs = useAppStore((s) => s.habitLogs);
  const addMood = useAppStore((s) => s.addMood);
  const toggleHabit = useAppStore((s) => s.toggleHabit);
  const addHabit = useAppStore((s) => s.addHabit);
  const archiveHabit = useAppStore((s) => s.archiveHabit);

  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [gratitude, setGratitude] = useState("");
  const [nh, setNh] = useState("");
  const [editHabits, setEditHabits] = useState(false);

  const today = oggi();
  const checkIns = moods.filter((m) => m.label !== "gratitudine");
  const last = checkIns[0];
  const low = last && last.date === today && ((last.moodIntensity ?? 3) <= 2 || (last.energy ?? 3) <= 2);
  const recent = [...checkIns.slice(0, 7)].reverse();

  const doneToday = (habitId: string) =>
    habitLogs.some((l) => l.habitId === habitId && l.date === today && l.done);

  const saveGratitude = async () => {
    const g = gratitude.trim();
    if (!g) return;
    await addMood({ label: "gratitudine", context: g });
    setGratitude("");
  };

  return (
    <div>
      <Card th={th} style={{ marginBottom: 12 }}>
        <Eyebrow th={th}>Check-in — umore ed energia, separati</Eyebrow>
        <label style={{ display: "block", fontSize: 13, color: th.sub, marginBottom: 6 }}>
          Umore: {MOOD_LABELS[mood - 1]}
          <input type="range" min="1" max="5" value={mood} onChange={(e) => setMood(+e.target.value)} style={{ width: "100%" }} />
        </label>
        <label style={{ display: "block", fontSize: 13, color: th.sub, marginBottom: 6 }}>
          Energia: {ENERGY_LABELS[energy - 1]}
          <input type="range" min="1" max="5" value={energy} onChange={(e) => setEnergy(+e.target.value)} style={{ width: "100%" }} />
        </label>
        <Btn th={th} small onClick={() => addMood({ moodIntensity: mood, energy })}>Registra</Btn>
      </Card>

      {low ? (
        <Card th={th} style={{ marginBottom: 12 }}>
          <div style={{ fontFamily: SERIF, fontSize: 15, color: th.ink }}>
            Oggi i numeri si fanno da parte. Se vuoi, c&apos;è lo spazio del dialogo.
          </div>
          <Btn th={th} small style={{ marginTop: 10 }} onClick={() => openDialogue()}>Apri il dialogo</Btn>
        </Card>
      ) : (
        recent.length > 0 && (
          <Card th={th} style={{ marginBottom: 12 }}>
            <Eyebrow th={th}>Ultimi check-in</Eyebrow>
            <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 70 }}>
              {recent.map((m) => (
                <div key={m.id} style={{ flex: 1, display: "flex", gap: 2, alignItems: "flex-end" }} title={`${m.date} ${m.time}`}>
                  <div style={{ flex: 1, height: (m.moodIntensity ?? 0) * 12, background: th.accent, borderRadius: 3 }} />
                  <div style={{ flex: 1, height: (m.energy ?? 0) * 12, background: th.good, borderRadius: 3 }} />
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: th.sub, marginTop: 6 }}>
              <span style={{ color: th.accent }}>■</span> umore · <span style={{ color: th.good }}>■</span> energia
            </div>
          </Card>
        )
      )}

      <Card th={th} style={{ marginBottom: 12 }}>
        <Eyebrow th={th}>Una gratitudine di oggi — se vuoi, la porti nel dialogo</Eyebrow>
        <textarea
          value={gratitude}
          onChange={(e) => setGratitude(e.target.value)}
          rows={2}
          placeholder="Oggi sono grato per…"
          style={{ ...inputStyle(th), resize: "none" }}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <Btn th={th} small onClick={saveGratitude} disabled={!gratitude.trim()}>Conserva</Btn>
          <Btn
            th={th} small ghost disabled={!gratitude.trim()}
            onClick={() => { const g = gratitude.trim(); saveGratitude(); openDialogue(`Oggi sono grato per: ${g}`); }}
          >
            Conserva e apri dialogo
          </Btn>
        </div>
      </Card>

      <Card th={th}>
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <Eyebrow th={th}>Abitudini — spunta serale</Eyebrow>
          <div style={{ flex: 1 }} />
          <button onClick={() => setEditHabits(!editHabits)} style={{ fontSize: 11, background: "transparent", border: "none", color: th.sub }}>
            {editHabits ? "fine" : "modifica"}
          </button>
        </div>
        {habits.filter((h) => h.isActive).map((h) => (
          <div key={h.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 0", borderTop: `1px solid ${th.line}` }}>
            <div
              onClick={() => toggleHabit(h.id, today)}
              style={{
                width: 20, height: 20, borderRadius: 6, cursor: "pointer",
                border: `2px solid ${doneToday(h.id) ? th.good : th.line}`,
                background: doneToday(h.id) ? th.good : "transparent",
                color: "#14161F", fontSize: 13, textAlign: "center", lineHeight: "17px",
              }}
            >
              {doneToday(h.id) ? "✓" : ""}
            </div>
            <span onClick={() => toggleHabit(h.id, today)} style={{ fontSize: 15, color: th.ink, cursor: "pointer", flex: 1 }}>
              {h.name}
            </span>
            {editHabits && (
              <button onClick={() => archiveHabit(h.id)} style={{ fontSize: 12, background: "transparent", border: "none", color: th.danger }}>
                rimuovi
              </button>
            )}
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <input
            value={nh}
            onChange={(e) => setNh(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && nh.trim()) { addHabit(nh.trim()); setNh(""); } }}
            placeholder="Nuova abitudine…"
            style={{ ...inputStyle(th), flex: 1, padding: 9 }}
          />
          <Btn th={th} small onClick={() => { if (nh.trim()) { addHabit(nh.trim()); setNh(""); } }}>+</Btn>
        </div>
      </Card>
    </div>
  );
}
