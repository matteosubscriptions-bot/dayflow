// SPECCHIO · Dialogo (spec §4): il Counselor riflette e fa UNA domanda.
// Commutatore normale/disagio CLIENT-SIDE, prima di qualsiasi rete:
// i contenuti di disagio non lasciano mai il dispositivo.

"use client";

import { useEffect, useRef, useState } from "react";
import { Btn, SERIF, type Theme } from "../ui";
import { useAppStore } from "@/store/useAppStore";
import { detectDistress, MSG_DISAGIO } from "@/lib/router";
import type { DialogueTurn } from "@/types";

const APERTURA: DialogueTurn = { role: "assistant", content: "Come arrivi qui, adesso?" };

export default function Dialogo({ th, seedText, onSeedConsumed }: {
  th: Theme;
  seedText?: string | null;
  onSeedConsumed?: () => void;
}) {
  const addTrait = useAppStore((s) => s.addTrait);
  const saveDialogue = useAppStore((s) => s.saveDialogue);
  const [turns, setTurns] = useState<DialogueTurn[]>([APERTURA]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [locked, setLocked] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const seedDone = useRef(false);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, [turns]);

  const send = async (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || busy) return;
    setInput("");
    const withUser: DialogueTurn[] = [...turns, { role: "user", content: text }];
    setTurns(withUser);

    // ── Commutatore normale/disagio: locale, prima della rete ──
    if (locked || detectDistress(text)) {
      setLocked(true);
      setTurns([...withUser, { role: "assistant", content: MSG_DISAGIO, local: true }]);
      return; // il contenuto NON viene inviato al cloud
    }

    setBusy(true);
    try {
      const history = withUser
        .filter((t) => !t.local)
        .map((t) => ({ role: t.role, content: t.content }));
      const res = await fetch("/api/dialogue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();
      if (data.distress) setLocked(true);
      setTurns([...withUser, { role: "assistant", content: data.reply, local: Boolean(data.local) }]);
    } catch {
      setTurns([
        ...withUser,
        { role: "assistant", content: "Sono offline: la tua osservazione resta qui, riprendiamo quando torna la rete.", local: true },
      ]);
    }
    setBusy(false);
  };

  // Un grezzo indirizzato a Specchio apre il dialogo con quel testo.
  useEffect(() => {
    if (seedText && !seedDone.current) {
      seedDone.current = true;
      send(seedText);
      onSeedConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedText]);

  const conserva = (msg: string) => {
    const m = msg.match(/Mi sembra che[^.?!]*[.?!]/i);
    const trait = m ? m[0] : msg.split(/[.?!]/)[0] + ".";
    addTrait(trait, "dal dialogo");
  };

  const chiudi = () => {
    if (turns.length > 1) saveDialogue(turns, locked);
    setTurns([APERTURA]);
    setLocked(false);
    seedDone.current = false;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {locked && (
        <div style={{ fontSize: 12, color: th.ink, background: th.accSoft, border: `1px solid ${th.line}`, borderRadius: 10, padding: 10, marginBottom: 10 }}>
          Modalità ascolto attiva per questa sessione: niente domande, niente cloud. Se vuoi, chiudi e riapri quando ti va.
        </div>
      )}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 8 }}>
        {turns.map((t, i) => (
          <div key={i} style={{ display: "flex", justifyContent: t.role === "user" ? "flex-end" : "flex-start", marginBottom: 10 }}>
            <div
              style={{
                maxWidth: "85%", padding: "10px 14px", borderRadius: 14, fontSize: 15, lineHeight: 1.5,
                whiteSpace: "pre-wrap",
                background: t.role === "user" ? th.accSoft : th.panel,
                border: `1px solid ${th.line}`, color: th.ink,
                fontFamily: t.role === "assistant" ? SERIF : "inherit",
              }}
            >
              {t.content}
              {t.role === "assistant" && i > 0 && !t.local && (
                <div style={{ marginTop: 8 }}>
                  <button
                    onClick={() => conserva(t.content)}
                    style={{ fontSize: 11, background: "transparent", border: "none", color: th.accent, padding: 0 }}
                  >
                    Conserva nel profilo →
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {busy && <div style={{ color: th.sub, fontSize: 13, fontFamily: SERIF }}>…</div>}
        <div ref={endRef} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={locked ? "Sono qui, senza domande." : "Scrivi ciò che osservi…"}
          style={{ flex: 1, background: th.panel, color: th.ink, border: `1px solid ${th.line}`, borderRadius: 12, padding: 12 }}
        />
        <Btn th={th} onClick={() => send()} disabled={busy}>→</Btn>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, alignItems: "center" }}>
        <span style={{ fontSize: 11, color: th.sub }}>Il silenzio è una risposta valida.</span>
        <button onClick={chiudi} style={{ fontSize: 12, background: "transparent", border: "none", color: th.sub }}>
          Chiudi e conserva dialogo
        </button>
      </div>
    </div>
  );
}
