// Self-test end-to-end: esercita TUTTE le funzionalità server con dati
// di prova marcati [TEST] e li elimina alla fine (anche in caso di
// errore). Ogni passo riporta esito, durata e dettaglio.
//
// Copre: cattura grezza (+router), elaborazione→task, elaborazione→idea
// (+connessioni proposte), idea→task (grafo), dialogo (normale e
// commutatore disagio), salvataggio dialogo, tratto profilo, check-in
// umore/energia, gratitudine, abitudini (crea/spunta/archivia),
// obiettivo di vita + task che lo sostiene, ricerca, review, export.
// La registrazione vocale è testabile solo nel browser: la pagina
// /status fa quella parte client-side.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { routeCapture, detectDistress } from "@/lib/router";
import { pickFrog } from "@/lib/heuristics";
import { aiAvailable } from "@/lib/anthropic";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Step = { name: string; ok: boolean; ms: number; detail: string };

// Chiama le route interne via fetch sull'host stesso: testa il percorso
// HTTP reale (routing, serializzazione), non solo le funzioni.
function makeCaller(origin: string) {
  return async (path: string, method = "GET", body?: unknown) => {
    const res = await fetch(origin + path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(`${method} ${path} → HTTP ${res.status}${data?.error ? ` (${data.error})` : ""}`);
    return data;
  };
}

export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  const call = makeCaller(origin);
  const steps: Step[] = [];
  const cleanup = {
    captures: [] as string[], tasks: [] as string[], ideas: [] as string[],
    dialogues: [] as string[], moods: [] as string[], habits: [] as string[],
    goals: [] as string[], traits: [] as string[], reports: [] as string[],
  };

  async function step(name: string, fn: () => Promise<string>) {
    const t0 = Date.now();
    try {
      const detail = await fn();
      steps.push({ name, ok: true, ms: Date.now() - t0, detail });
    } catch (e) {
      steps.push({ name, ok: false, ms: Date.now() - t0, detail: e instanceof Error ? e.message : String(e) });
    }
  }

  // ── 0. DB ──
  await step("Connessione database", async () => {
    const t0 = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    return `PostgreSQL raggiungibile in ${Date.now() - t0}ms`;
  });

  // ── 1. Router locale ──
  await step("Router locale (task/idea/specchio)", async () => {
    const a = routeCapture("devo pagare la bolletta entro domani");
    const b = routeCapture("mi è venuta in mente un'idea per un progetto");
    const c = routeCapture("mi sento pieno di gratitudine stasera");
    if (a.domain !== "officina-task") throw new Error(`task→${a.domain}`);
    if (b.domain !== "officina-idea") throw new Error(`idea→${b.domain}`);
    if (c.domain !== "specchio") throw new Error(`specchio→${c.domain}`);
    return "3/3 classificazioni corrette";
  });

  await step("Rilevamento disagio (client-side, locale)", async () => {
    if (!detectDistress("non ce la faccio più, nessuna via d'uscita")) throw new Error("segnale non rilevato");
    if (detectDistress("oggi è una bella giornata")) throw new Error("falso positivo");
    return "commutatore normale/disagio corretto";
  });

  // ── 2. Cattura grezza ──
  let captureTaskId = "";
  await step("Salvataggio grezzo (cattura)", async () => {
    const c = await call("/api/captures", "POST", {
      raw: "[TEST] devo chiamare il dentista entro venerdì",
      source: "voice", surface: "officina",
    });
    captureTaskId = c.id;
    cleanup.captures.push(c.id);
    if (c.status !== "pending") throw new Error("status non pending");
    if (c.suggested !== "officina-task") throw new Error(`router: ${c.suggested}`);
    return `grezzo salvato, router → Task`;
  });

  // ── 3. Elaborazione → task ──
  await step(`Elaborazione grezzo → task (${aiAvailable() ? "AI cloud" : "fallback locale"})`, async () => {
    const out = await call("/api/elaborate", "POST", { captureId: captureTaskId, domain: "officina-task" });
    if (!out.task?.id) throw new Error("task non creato");
    cleanup.tasks.push(out.task.id);
    if (out.capture.status !== "processed") throw new Error("capture non processed");
    return `task «${out.task.title.slice(0, 40)}» creato (usedAI: ${out.usedAI})`;
  });

  // ── 4. Elaborazione → idea + connessioni ──
  let ideaId = "";
  await step("Elaborazione grezzo → idea + connessioni proposte", async () => {
    const c1 = await call("/api/captures", "POST", {
      raw: "[TEST] idea per un orto verticale con sensori di umidità", source: "text", surface: "officina",
    });
    cleanup.captures.push(c1.id);
    const o1 = await call("/api/elaborate", "POST", { captureId: c1.id, domain: "officina-idea" });
    if (!o1.idea?.id) throw new Error("idea non creata");
    cleanup.ideas.push(o1.idea.id);
    const c2 = await call("/api/captures", "POST", {
      raw: "[TEST] idea orto verticale balcone con sensori e irrigazione", source: "text", surface: "officina",
    });
    cleanup.captures.push(c2.id);
    const o2 = await call("/api/elaborate", "POST", { captureId: c2.id, domain: "officina-idea" });
    if (!o2.idea?.id) throw new Error("seconda idea non creata");
    ideaId = o2.idea.id;
    cleanup.ideas.push(o2.idea.id);
    const foundSimilar = (o2.similar || []).length > 0;
    return `2 idee create; connessione proposta: ${foundSimilar ? "sì («somiglia a…»)" : "no (dipende dall'AI/temi)"}`;
  });

  // ── 5. Idea → task (grafo) ──
  await step("Idea matura → task (link became_task nel grafo)", async () => {
    await call(`/api/ideas/${ideaId}`, "PATCH", { maturity: "mature" });
    const out = await call(`/api/ideas/${ideaId}`, "PATCH", { action: "become-task" });
    if (!out.task?.id || out.link?.relation !== "became_task") throw new Error("link mancante");
    cleanup.tasks.push(out.task.id);
    return "task creato e collegato all'idea";
  });

  // ── 6. Prioritizzazione ──
  await step("Motore priorità (rana del giorno)", async () => {
    const tasks = await prisma.task.findMany({ where: { id: { in: cleanup.tasks } } });
    const frog = pickFrog(tasks.map((t) => ({ ...t, createdAt: "", dueDate: null, scheduledDate: null, completedAt: null })) as never);
    if (!frog) throw new Error("nessuna rana con task aperti");
    return `rana scelta: «${(frog as { title: string }).title.slice(0, 40)}»`;
  });

  // ── 7. Dialogo ──
  await step(`Dialogo Counselor (${aiAvailable() ? "AI cloud" : "fallback locale"})`, async () => {
    const out = await call("/api/dialogue", "POST", {
      messages: [
        { role: "assistant", content: "Come arrivi qui, adesso?" },
        { role: "user", content: "[TEST] mi accorgo che rimando le cose difficili" },
      ],
    });
    if (!out.reply) throw new Error("nessuna risposta");
    return `risposta ricevuta (${out.local ? "locale" : "cloud"}): «${out.reply.slice(0, 50)}…»`;
  });

  await step("Dialogo: commutatore disagio blocca il cloud", async () => {
    const out = await call("/api/dialogue", "POST", {
      messages: [{ role: "user", content: "non ce la faccio più, nessuna via d'uscita" }],
    });
    if (!out.distress || !out.local) throw new Error("il commutatore non è scattato");
    return "modalità ascolto attivata, nessuna chiamata cloud";
  });

  await step("Salvataggio dialogo nello storico", async () => {
    const d = await call("/api/dialogues", "POST", {
      transcript: [
        { role: "assistant", content: "Come arrivi qui, adesso?" },
        { role: "user", content: "[TEST] dialogo di prova" },
      ],
      distress: false,
    });
    cleanup.dialogues.push(d.id);
    return "transcript conservato";
  });

  await step("Tratto nel profilo evolutivo", async () => {
    const t = await call("/api/traits", "POST", { trait: "[TEST] Mi sembra che tu preferisca iniziare tardi.", evidence: "self-test" });
    cleanup.traits.push(t.id);
    return "tratto conservato su conferma";
  });

  // ── 8. Diario ──
  await step("Check-in umore/energia (separati)", async () => {
    const m = await call("/api/moods", "POST", { moodIntensity: 4, energy: 2, context: "[TEST]" });
    cleanup.moods.push(m.id);
    return `registrato ${m.date} ${m.time}`;
  });

  await step("Gratitudine come voce di diario", async () => {
    const m = await call("/api/moods", "POST", { label: "gratitudine", context: "[TEST] grazie per il self-test" });
    cleanup.moods.push(m.id);
    return "gratitudine conservata";
  });

  await step("Abitudini: crea, spunta (toggle), archivia", async () => {
    const h = await call("/api/habits", "POST", { name: "[TEST] Abitudine di prova" });
    cleanup.habits.push(h.id);
    const today = new Date().toISOString().slice(0, 10);
    const on = await call("/api/habitlogs", "POST", { habitId: h.id, date: today });
    if (!on.done) throw new Error("toggle on fallito");
    const off = await call("/api/habitlogs", "POST", { habitId: h.id, date: today });
    if (off.done) throw new Error("toggle off fallito");
    await call(`/api/habits/${h.id}`, "PATCH", { isActive: false });
    return "ciclo completo ok";
  });

  // ── 9. Obiettivi di vita (ponte Specchio→Officina) ──
  await step("Obiettivo di vita + task che lo sostiene", async () => {
    const g = await call("/api/goals", "POST", {
      title: "[TEST] Obiettivo di prova", horizon: "quarter", whyDeep: "verificare il ponte",
    });
    cleanup.goals.push(g.id);
    const t = await call("/api/tasks", "POST", { title: "[TEST] Task che sostiene l'obiettivo", supportsGoalId: g.id, importance: 5 });
    cleanup.tasks.push(t.id);
    if (t.supportsGoalId !== g.id) throw new Error("aggancio mancante");
    return "il fare è agganciato all'identità (supports_goal)";
  });

  // ── 10. Ricerca / review / export ──
  await step("Ricerca trasversale", async () => {
    const out = await call(`/api/search?q=${encodeURIComponent("[TEST]")}`);
    if (!out.results?.length) throw new Error("nessun risultato sui dati di prova");
    return `${out.results.length} risultati trovati`;
  });

  await step(`Review settimanale (${aiAvailable() ? "con narrativa AI" : "solo numeri"})`, async () => {
    const r = await call("/api/review");
    cleanup.reports.push(r.id);
    if (!r.contentJson) throw new Error("numeri mancanti");
    return `report generato (${r.narrative ? "con" : "senza"} narrativa)`;
  });

  await step("Export completo (sovranità del dato)", async () => {
    const res = await fetch(origin + "/api/export", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const dump = await res.json();
    const keys = Object.keys(dump).length;
    if (!dump.tasks || !dump.captures) throw new Error("dump incompleto");
    return `${keys} sezioni esportate`;
  });

  // ── Pulizia: i dati di prova spariscono sempre ──
  const t0 = Date.now();
  let cleanupDetail = "";
  try {
    const testIds = [
      ...cleanup.captures, ...cleanup.tasks, ...cleanup.ideas,
      ...cleanup.goals, ...cleanup.habits,
    ];
    await prisma.link.deleteMany({ where: { OR: [{ fromId: { in: testIds } }, { toId: { in: testIds } }] } });
    await prisma.entityTag.deleteMany({ where: { entityId: { in: testIds } } });
    await prisma.habitLog.deleteMany({ where: { habitId: { in: cleanup.habits } } });
    await prisma.task.deleteMany({ where: { id: { in: cleanup.tasks } } });
    await prisma.idea.deleteMany({ where: { id: { in: cleanup.ideas } } });
    await prisma.capture.deleteMany({ where: { id: { in: cleanup.captures } } });
    await prisma.dialogue.deleteMany({ where: { id: { in: cleanup.dialogues } } });
    await prisma.mood.deleteMany({ where: { id: { in: cleanup.moods } } });
    await prisma.habit.deleteMany({ where: { id: { in: cleanup.habits } } });
    await prisma.lifeGoal.deleteMany({ where: { id: { in: cleanup.goals } } });
    await prisma.profileTrait.deleteMany({ where: { id: { in: cleanup.traits } } });
    await prisma.report.deleteMany({ where: { id: { in: cleanup.reports } } });
    cleanupDetail = "tutti i dati [TEST] rimossi";
  } catch (e) {
    cleanupDetail = "ATTENZIONE: pulizia parziale — " + (e instanceof Error ? e.message : String(e));
  }
  steps.push({ name: "Pulizia dati di prova", ok: cleanupDetail.startsWith("tutti"), ms: Date.now() - t0, detail: cleanupDetail });

  const passed = steps.filter((s) => s.ok).length;
  return NextResponse.json({
    ok: passed === steps.length,
    passed,
    total: steps.length,
    aiMode: aiAvailable() ? "cloud" : "fallback locale",
    time: new Date().toISOString(),
    steps,
  });
}
