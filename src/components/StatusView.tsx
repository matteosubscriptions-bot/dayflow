"use client";

// Pagina di stato: salute dell'app (DB, AI, dati), check del browser
// (registrazione vocale, storage locale, rete) e self-test end-to-end
// di tutte le funzionalità server con dati [TEST] auto-rimossi.

import { useEffect, useRef, useState } from "react";
import { Btn, Card, Eyebrow, T_OFF as th, SANS } from "@/components/ui";
import { useVoice } from "@/components/useVoice";

type Health = {
  ok: boolean;
  time: string;
  db: { ok: boolean; latencyMs: number; url: string };
  ai: { enabled: boolean; model: string; mode: string };
  counts: Record<string, number> | null;
  env: { nodeVersion: string; nextEnv: string };
};

type Step = { name: string; ok: boolean; ms: number; detail: string };
type SelfTest = { ok: boolean; passed: number; total: number; aiMode: string; steps: Step[] };

const Dot = ({ ok, warn }: { ok: boolean; warn?: boolean }) => (
  <span style={{ color: warn ? "#B8860B" : ok ? th.good : th.danger, fontWeight: 700 }}>
    {warn ? "◐" : ok ? "●" : "●"}
  </span>
);

function Row({ label, ok, warn, detail }: { label: string; ok: boolean; warn?: boolean; detail: string }) {
  return (
    <div style={{ display: "flex", gap: 10, padding: "8px 0", borderTop: `1px solid ${th.line}`, alignItems: "baseline" }}>
      <Dot ok={ok} warn={warn} />
      <div style={{ minWidth: 210, fontSize: 14, color: th.ink, fontWeight: 600 }}>{label}</div>
      <div style={{ flex: 1, fontSize: 13, color: ok || warn ? th.sub : th.danger }}>{detail}</div>
    </div>
  );
}

export default function StatusView() {
  const [health, setHealth] = useState<Health | null>(null);
  const [healthErr, setHealthErr] = useState<string | null>(null);
  const [test, setTest] = useState<SelfTest | null>(null);
  const [testing, setTesting] = useState(false);

  // Check browser
  const [storageOk, setStorageOk] = useState<boolean | null>(null);
  const [online, setOnline] = useState(true);
  const [micTranscript, setMicTranscript] = useState("");
  const micFinal = useRef("");
  const voice = useVoice((t) => {
    micFinal.current = (micFinal.current + " " + t).trim();
    setMicTranscript(micFinal.current);
  });

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then(setHealth)
      .catch((e) => setHealthErr(String(e)));
    try {
      localStorage.setItem("os-status-check", "ok");
      setStorageOk(localStorage.getItem("os-status-check") === "ok");
      localStorage.removeItem("os-status-check");
    } catch {
      setStorageOk(false);
    }
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  const runTest = async () => {
    setTesting(true);
    setTest(null);
    try {
      const res = await fetch("/api/selftest");
      setTest(await res.json());
    } catch (e) {
      setTest({ ok: false, passed: 0, total: 0, aiMode: "?", steps: [{ name: "Chiamata self-test", ok: false, ms: 0, detail: String(e) }] });
    }
    setTesting(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: th.bg, fontFamily: SANS, padding: "20px 16px 60px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 16 }}>
          <h1 style={{ fontSize: 22, color: th.ink, margin: 0 }}>Stato del sistema</h1>
          <a href="/" style={{ fontSize: 13, color: th.accent }}>← all&apos;app</a>
        </div>

        {/* ── Salute server ── */}
        <Card th={th} style={{ marginBottom: 14 }}>
          <Eyebrow th={th}>Server & dati</Eyebrow>
          {healthErr && <Row label="API /api/status" ok={false} detail={healthErr} />}
          {!health && !healthErr && <div style={{ color: th.sub, fontSize: 13 }}>Controllo…</div>}
          {health && (
            <>
              <Row label="App / API" ok detail={`attiva · Node ${health.env.nodeVersion} · ${health.env.nextEnv}`} />
              <Row
                label="Database PostgreSQL"
                ok={health.db.ok}
                detail={health.db.ok ? `connesso · ${health.db.latencyMs}ms · DATABASE_URL ${health.db.url}` : `NON connesso · DATABASE_URL ${health.db.url}`}
              />
              <Row
                label="AI (Anthropic)"
                ok={health.ai.enabled}
                warn={!health.ai.enabled}
                detail={health.ai.enabled ? `attiva · ${health.ai.model}` : "chiave assente → fallback locali (l'app funziona comunque)"}
              />
              {health.counts && (
                <Row
                  label="Archivio"
                  ok
                  detail={Object.entries(health.counts).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                />
              )}
            </>
          )}
        </Card>

        {/* ── Check browser ── */}
        <Card th={th} style={{ marginBottom: 14 }}>
          <Eyebrow th={th}>Questo browser (cattura vocale & offline)</Eyebrow>
          <Row
            label="Riconoscimento vocale"
            ok={voice.supported}
            detail={voice.supported ? "Web Speech API disponibile (it-IT)" : "non disponibile qui — usa Chrome/Edge/Safari; il testo funziona sempre"}
          />
          <Row
            label="Storage locale (coda offline)"
            ok={storageOk === true}
            detail={storageOk ? "localStorage leggibile/scrivibile" : storageOk === false ? "non disponibile" : "…"}
          />
          <Row label="Rete" ok={online} warn={!online} detail={online ? "online" : "offline — la cattura resta comunque possibile"} />
          {voice.supported && (
            <div style={{ marginTop: 10, borderTop: `1px solid ${th.line}`, paddingTop: 10 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Btn th={th} small ghost onClick={() => {
                  if (voice.listening) { voice.stop(); } else { micFinal.current = ""; setMicTranscript(""); voice.start(); }
                }}>
                  {voice.listening ? "◼ Stop test" : "🎙 Test microfono"}
                </Btn>
                {voice.listening && <span style={{ fontSize: 12, color: th.accent }}>● in ascolto… di&apos; qualcosa</span>}
              </div>
              {(micTranscript || voice.interim) && (
                <div style={{ fontSize: 14, color: th.ink, marginTop: 8, background: th.bg, border: `1px solid ${th.line}`, borderRadius: 10, padding: 10 }}>
                  {micTranscript} <i style={{ color: th.sub }}>{voice.interim}</i>
                </div>
              )}
              {micTranscript && !voice.listening && (
                <div style={{ fontSize: 12, color: th.good, marginTop: 6 }}>✓ registrazione vocale funzionante (trascrizione ricevuta)</div>
              )}
              {voice.error && <div style={{ fontSize: 12, color: th.danger, marginTop: 6 }}>{voice.error}</div>}
            </div>
          )}
        </Card>

        {/* ── Self-test ── */}
        <Card th={th}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Eyebrow th={th}>Self-test funzionalità (end-to-end)</Eyebrow>
            <div style={{ flex: 1 }} />
            <Btn th={th} small onClick={runTest} disabled={testing}>
              {testing ? "Eseguo…" : test ? "Riesegui" : "Esegui test completo"}
            </Btn>
          </div>
          <div style={{ fontSize: 12, color: th.sub, marginTop: 4 }}>
            Crea dati marcati [TEST] su tutte le funzioni — cattura, elaborazione, dialogo, diario,
            obiettivi, ricerca, review, export — e li rimuove alla fine.
          </div>
          {testing && <div style={{ color: th.sub, fontSize: 13, marginTop: 12 }}>Test in corso… (con AI attiva può richiedere qualche secondo)</div>}
          {test && (
            <>
              <div style={{ marginTop: 12, fontSize: 15, fontWeight: 700, color: test.ok ? th.good : th.danger }}>
                {test.ok ? "✓" : "✗"} {test.passed}/{test.total} passi superati · AI: {test.aiMode}
              </div>
              <div style={{ marginTop: 6 }}>
                {test.steps.map((s, i) => (
                  <Row key={i} label={s.name} ok={s.ok} detail={`${s.detail} · ${s.ms}ms`} />
                ))}
              </div>
            </>
          )}
        </Card>

        <div style={{ fontSize: 11, color: th.sub, textAlign: "center", marginTop: 16 }}>
          Officina &amp; Specchio · schema v2 · {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
