// SPECCHIO · Profilo: il ritratto evolutivo (pattern emersi dai dialoghi,
// conservati su conferma), lo storico dei dialoghi, l'export dei dati.

"use client";

import { useState } from "react";
import { Card, Eyebrow, SERIF, type Theme } from "../ui";
import { useAppStore } from "@/store/useAppStore";

export default function Profilo({ th }: { th: Theme }) {
  const traits = useAppStore((s) => s.traits);
  const dialogues = useAppStore((s) => s.dialogues);
  const [openD, setOpenD] = useState<string | null>(null);

  return (
    <div>
      <Eyebrow th={th}>Il ritratto evolutivo — pattern emersi dai dialoghi</Eyebrow>
      {traits.map((t) => (
        <Card th={th} key={t.id} style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 15, color: th.ink, fontFamily: SERIF }}>{t.trait}</div>
          <div style={{ fontSize: 11, color: th.sub, marginTop: 4 }}>
            {t.detectedAt.slice(0, 10)} · {t.evidence}
          </div>
        </Card>
      ))}
      {!traits.length && (
        <div style={{ color: th.sub, fontSize: 14, padding: 12, fontFamily: SERIF }}>
          Il ritratto si costruisce nel tempo, un dialogo alla volta. Quando emerge qualcosa di vero,
          conservalo da lì.
        </div>
      )}

      {dialogues.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Eyebrow th={th}>Storico dialoghi · {dialogues.length}</Eyebrow>
          {dialogues.map((d) => (
            <Card th={th} key={d.id} style={{ marginBottom: 8 }}>
              <div
                style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}
                onClick={() => setOpenD(openD === d.id ? null : d.id)}
              >
                <div style={{ flex: 1, fontSize: 13, color: th.ink }}>
                  {d.startedAt.slice(0, 10)} · {d.transcript.filter((t) => t.role === "user").length} osservazioni
                  {d.distress && <span style={{ color: th.sub }}> · in ascolto</span>}
                </div>
                <span style={{ color: th.sub }}>{openD === d.id ? "▾" : "▸"}</span>
              </div>
              {openD === d.id && (
                <div style={{ marginTop: 8, borderTop: `1px solid ${th.line}`, paddingTop: 8 }}>
                  {d.transcript.map((t, i) => (
                    <div key={i} style={{ fontSize: 13, color: t.role === "user" ? th.ink : th.sub, padding: "3px 0", fontFamily: t.role === "assistant" ? SERIF : "inherit" }}>
                      <b>{t.role === "user" ? "tu" : "specchio"}:</b> {t.content}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <div style={{ marginTop: 20, textAlign: "center" }}>
        <a
          href="/api/export"
          download
          style={{ fontSize: 13, color: th.accent, textDecoration: "underline" }}
        >
          Esporta tutti i dati (JSON aperto)
        </a>
        <div style={{ fontSize: 11, color: th.sub, marginTop: 4 }}>
          Il dato è tuo: tutto scaricabile, sempre.
        </div>
      </div>
    </div>
  );
}
