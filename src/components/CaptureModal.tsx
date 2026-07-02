// Cattura (spec §2): un tasto, si parla. Il grezzo si salva subito,
// senza struttura. Voce con trascrizione live, testo come fallback.

"use client";

import { useEffect, useState } from "react";
import { Btn, Eyebrow, type Theme } from "./ui";
import { useVoice } from "./useVoice";

export default function CaptureModal({
  th, surface, onClose, onSave,
}: {
  th: Theme;
  surface: string;
  onClose: () => void;
  onSave: (text: string, source: string) => void;
}) {
  const [text, setText] = useState("");
  const [usedVoice, setUsedVoice] = useState(false);
  const voice = useVoice((finalText) => {
    setUsedVoice(true);
    setText((t) => (t ? t + " " : "") + finalText);
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { voice.stop(); onClose(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = () => {
    const t = text.trim();
    if (!t) return;
    voice.stop();
    onSave(t, usedVoice ? "voice" : "text");
    onClose();
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(10,12,18,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50 }}
      onClick={() => { voice.stop(); onClose(); }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 560, background: th.panel, borderRadius: "18px 18px 0 0", border: `1px solid ${th.line}`, padding: 18 }}
      >
        <Eyebrow th={th}>Cattura — il grezzo si salva subito, l&apos;ordine arriva dopo</Eyebrow>
        <textarea
          autoFocus={!voice.supported}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="Parla o scrivi, senza struttura…"
          style={{ width: "100%", background: th.bg, color: th.ink, border: `1px solid ${th.line}`, borderRadius: 12, padding: 12, resize: "none" }}
        />
        {voice.interim && (
          <div style={{ fontSize: 14, color: th.sub, fontStyle: "italic", marginTop: 6 }}>{voice.interim}…</div>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          {voice.supported && (
            <Btn th={th} ghost onClick={voice.listening ? voice.stop : voice.start}>
              {voice.listening ? "◼ Stop" : "🎙 Voce"}
            </Btn>
          )}
          <div style={{ flex: 1 }} />
          <Btn th={th} ghost onClick={() => { voice.stop(); onClose(); }}>Annulla</Btn>
          <Btn th={th} disabled={!text.trim()} onClick={save}>Salva grezzo</Btn>
        </div>
        {voice.listening && (
          <div style={{ fontSize: 12, color: th.accent, marginTop: 8 }}>
            ● In ascolto… parla pure, la trascrizione è locale (superficie: {surface === "officina" ? "Officina" : "Specchio"})
          </div>
        )}
        {voice.error && <div style={{ fontSize: 12, color: th.danger, marginTop: 8 }}>{voice.error}</div>}
        {!voice.supported && (
          <div style={{ fontSize: 12, color: th.sub, marginTop: 8 }}>
            Questo browser non ha il riconoscimento vocale (Chrome/Edge/Safari sì): scrivi pure.
          </div>
        )}
      </div>
    </div>
  );
}
