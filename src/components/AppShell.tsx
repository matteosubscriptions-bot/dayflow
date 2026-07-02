// Un sistema, due superfici (spec §1): OFFICINA (il fare) e SPECCHIO
// (l'essere) vivono nello stesso posto e si passano solo gli obiettivi
// di vita, in sola lettura. La soglia in alto è il commutatore.

"use client";

import { useCallback, useEffect, useState } from "react";
import { Btn, Card, Eyebrow, SANS, SERIF, T_OFF, T_SPE } from "./ui";
import CaptureModal from "./CaptureModal";
import CaptureQueue from "./CaptureQueue";
import Oggi from "./officina/Oggi";
import Progetti from "./officina/Progetti";
import Idee from "./officina/Idee";
import Cerca from "./officina/Cerca";
import Dialogo from "./specchio/Dialogo";
import Diario from "./specchio/Diario";
import Timeline from "./specchio/Timeline";
import Obiettivi from "./specchio/Obiettivi";
import Profilo from "./specchio/Profilo";
import { useAppStore } from "@/store/useAppStore";
import type { CaptureT } from "@/types";

const OFF_TABS = [["home", "Oggi"], ["progetti", "Progetti"], ["idee", "Idee"], ["cerca", "Cerca"]] as const;
const SPE_TABS = [["home", "Dialogo"], ["diario", "Diario"], ["timeline", "Timeline"], ["obiettivi", "Obiettivi"], ["profilo", "Profilo"]] as const;

export default function AppShell() {
  const [surface, setSurface] = useState<"officina" | "specchio">("specchio");
  const [tab, setTab] = useState("home");
  const [showCapture, setShowCapture] = useState(false);
  const [dialogueSeed, setDialogueSeed] = useState<string | null>(null);
  const [similar, setSimilar] = useState<{ forIdea: string; items: { id: string; title: string }[] } | null>(null);

  const loaded = useAppStore((s) => s.loaded);
  const online = useAppStore((s) => s.online);
  const toast = useAppStore((s) => s.toast);
  const load = useAppStore((s) => s.load);
  const setOnline = useAppStore((s) => s.setOnline);
  const saveCapture = useAppStore((s) => s.saveCapture);
  const elaborate = useAppStore((s) => s.elaborate);
  const linkIdeas = useAppStore((s) => s.linkIdeas);
  const ideas = useAppStore((s) => s.ideas);

  const th = surface === "officina" ? T_OFF : T_SPE;

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, [setOnline]);

  const openDialogue = useCallback((seed?: string) => {
    setSurface("specchio");
    setTab("home");
    if (seed) setDialogueSeed(seed);
  }, []);

  const onElaborate = useCallback(
    async (c: CaptureT, domain: string) => {
      const out = await elaborate(c, domain);
      if (out.openDialogue) {
        // In Specchio non si archivia e basta: si apre il dialogo col grezzo.
        openDialogue(c.raw);
      }
      if (out.similar?.length) {
        const created = useAppStore.getState().ideas[0];
        if (created) setSimilar({ forIdea: created.id, items: out.similar });
      }
    },
    [elaborate, openDialogue]
  );

  if (!loaded) {
    return (
      <div style={{ minHeight: "100vh", background: T_SPE.bg, color: T_SPE.sub, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS }}>
        …
      </div>
    );
  }

  const tabs = surface === "officina" ? OFF_TABS : SPE_TABS;

  return (
    <div style={{ minHeight: "100vh", background: th.bg, fontFamily: SANS, transition: "background .3s", display: "flex", flexDirection: "column" }}>
      {/* LA SOGLIA — il commutatore tra i due materiali */}
      <div style={{ padding: "14px 16px 10px", position: "sticky", top: 0, background: th.bg, zIndex: 10 }}>
        <div style={{ display: "flex", borderRadius: 999, overflow: "hidden", border: `1px solid ${th.line}` }}>
          <button
            onClick={() => { setSurface("officina"); setTab("home"); }}
            aria-pressed={surface === "officina"}
            style={{ flex: 1, padding: "10px 0", border: "none", fontWeight: 700, fontSize: 13, letterSpacing: "0.06em", background: surface === "officina" ? T_OFF.panel : "transparent", color: surface === "officina" ? T_OFF.ink : th.sub }}
          >
            🛠 OFFICINA
          </button>
          <button
            onClick={() => { setSurface("specchio"); setTab("home"); }}
            aria-pressed={surface === "specchio"}
            style={{ flex: 1, padding: "10px 0", border: "none", fontWeight: 700, fontSize: 13, letterSpacing: "0.06em", fontFamily: SERIF, background: surface === "specchio" ? T_SPE.panel : "transparent", color: surface === "specchio" ? T_SPE.ink : th.sub }}
          >
            🪞 Specchio
          </button>
        </div>
        {!online && (
          <div style={{ fontSize: 11, color: th.sub, textAlign: "center", marginTop: 6 }}>
            ○ offline — la cattura funziona comunque, l&apos;elaborazione riprende con la rete
          </div>
        )}
      </div>

      <div style={{ flex: 1, padding: "8px 16px 96px", maxWidth: 560, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column" }}>
        {surface === "specchio" && tab === "home" && (
          <h1 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 24, color: th.ink, margin: "6px 0 14px" }}>
            Lo spazio per guardarsi dentro.
          </h1>
        )}
        <CaptureQueue th={th} onElaborate={onElaborate} />

        {surface === "officina" && tab === "home" && <Oggi th={th} goToIdeas={() => setTab("idee")} />}
        {surface === "officina" && tab === "progetti" && <Progetti th={th} />}
        {surface === "officina" && tab === "idee" && <Idee th={th} />}
        {surface === "officina" && tab === "cerca" && <Cerca th={th} />}

        {surface === "specchio" && tab === "home" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 380 }}>
            <Dialogo th={th} seedText={dialogueSeed} onSeedConsumed={() => setDialogueSeed(null)} />
          </div>
        )}
        {surface === "specchio" && tab === "diario" && <Diario th={th} openDialogue={openDialogue} />}
        {surface === "specchio" && tab === "timeline" && <Timeline th={th} />}
        {surface === "specchio" && tab === "obiettivi" && <Obiettivi th={th} />}
        {surface === "specchio" && tab === "profilo" && <Profilo th={th} />}
      </div>

      {/* Connessioni proposte: "somiglia a X — collegare?" */}
      {similar && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,12,18,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 40 }} onClick={() => setSimilar(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 560, background: th.panel, borderRadius: "18px 18px 0 0", border: `1px solid ${th.line}`, padding: 18 }}>
            <Eyebrow th={th}>Connessioni proposte</Eyebrow>
            <div style={{ fontSize: 14, color: th.ink, marginBottom: 8 }}>
              «{ideas.find((i) => i.id === similar.forIdea)?.title}» somiglia a:
            </div>
            {similar.items.map((s) => (
              <Card th={th} key={s.id} style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1, fontSize: 14, color: th.ink }}>{s.title}</div>
                <Btn
                  th={th} small
                  onClick={() => {
                    linkIdeas(similar.forIdea, s.id);
                    setSimilar((cur) => cur && { ...cur, items: cur.items.filter((x) => x.id !== s.id) });
                  }}
                >
                  Collega
                </Btn>
              </Card>
            ))}
            <Btn th={th} ghost style={{ width: "100%", marginTop: 4 }} onClick={() => setSimilar(null)}>Chiudi</Btn>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 140, left: "50%", transform: "translateX(-50%)", background: th.ink, color: th.bg, fontSize: 13, padding: "10px 16px", borderRadius: 12, zIndex: 60, maxWidth: "88%", textAlign: "center" }}>
          {toast}
        </div>
      )}

      {/* CATTURA — sempre a un tocco */}
      <button
        onClick={() => setShowCapture(true)}
        aria-label="Cattura"
        style={{ position: "fixed", right: 18, bottom: 76, width: 56, height: 56, borderRadius: "50%", border: "none", background: th.accent, color: th.dark ? "#14161F" : "#FBFAF6", fontSize: 22, boxShadow: "0 4px 16px rgba(0,0,0,0.25)", zIndex: 20 }}
      >
        ＋
      </button>

      {/* NAV */}
      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: th.panel, borderTop: `1px solid ${th.line}`, display: "flex", zIndex: 20 }}>
        {tabs.map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{ flex: 1, padding: "14px 0 18px", border: "none", background: "transparent", fontSize: 13, fontWeight: tab === k ? 700 : 500, color: tab === k ? th.accent : th.sub, borderTop: tab === k ? `2px solid ${th.accent}` : "2px solid transparent" }}
          >
            {label}
          </button>
        ))}
      </nav>

      {showCapture && (
        <CaptureModal
          th={th}
          surface={surface}
          onClose={() => setShowCapture(false)}
          onSave={(text, source) => saveCapture(text, source, surface)}
        />
      )}
    </div>
  );
}
