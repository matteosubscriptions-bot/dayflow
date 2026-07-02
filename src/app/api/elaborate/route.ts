// Elaborazione differita del grezzo (spec §2): l'Elaboratore pulisce,
// estrae titolo/tag/tema e crea il task o l'idea. Il grezzo non viene
// mai cancellato; se l'AI non è raggiungibile si usa il fallback locale.
// Per le idee: connessioni proposte per vicinanza di tema ("somiglia a X").

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { chiamaAI, aiAvailable, elaborateFallback } from "@/lib/anthropic";
import { SYS_ELABORATORE } from "@/lib/agents";
import { similarity } from "@/lib/heuristics";

type Elaborato = {
  titolo: string;
  testo: string;
  tipo: string;
  tags?: string[];
  urgenza?: number;
  importanza?: number;
  tema?: string | null;
};

export async function POST(req: Request) {
  const { captureId, domain } = await req.json();
  const capture = await prisma.capture.findUnique({ where: { id: captureId } });
  if (!capture) return NextResponse.json({ error: "cattura non trovata" }, { status: 404 });

  // In SPECCHIO non si archivia e basta: il client apre il dialogo.
  if (domain === "specchio") {
    const updated = await prisma.capture.update({
      where: { id: capture.id },
      data: { status: "processed", domain, processedAt: new Date() },
    });
    return NextResponse.json({ capture: updated, openDialogue: true });
  }

  const tipoHint = domain === "officina-idea" ? "idea" : "task";
  let j: Elaborato;
  let usedAI = false;
  if (aiAvailable()) {
    try {
      const out = await chiamaAI(SYS_ELABORATORE, [{ role: "user", content: capture.raw }]);
      j = JSON.parse(out.replace(/```json|```/g, "").trim());
      usedAI = true;
    } catch {
      j = elaborateFallback(capture.raw, tipoHint);
    }
  } else {
    j = elaborateFallback(capture.raw, tipoHint);
  }
  // Il dominio scelto dall'utente prevale sul tipo proposto dall'AI.
  const tipo = domain === "officina-task" ? "task" : domain === "officina-idea" ? "idea" : j.tipo;

  const updatedCapture = await prisma.capture.update({
    where: { id: capture.id },
    data: { status: "processed", domain, aiClean: j.testo, processedAt: new Date() },
  });

  // Tag estratti → tassonomia pulita (tabella tags + entity_tags).
  async function saveTags(entityType: string, entityId: string) {
    for (const name of (j.tags || []).slice(0, 3)) {
      const clean = name.toLowerCase().trim();
      if (!clean) continue;
      const tag = await prisma.tag.upsert({ where: { name: clean }, update: {}, create: { name: clean } });
      await prisma.entityTag.upsert({
        where: { entityType_entityId_tagId: { entityType, entityId, tagId: tag.id } },
        update: {},
        create: { entityType, entityId, tagId: tag.id },
      });
    }
  }

  if (tipo === "task") {
    const task = await prisma.task.create({
      data: {
        title: j.titolo,
        urgency: Math.min(5, Math.max(1, j.urgenza || 3)),
        importance: Math.min(5, Math.max(1, j.importanza || 3)),
        captureId: capture.id,
      },
    });
    await prisma.link.create({
      data: { fromType: "capture", fromId: capture.id, toType: "task", toId: task.id, relation: "from_capture", createdBy: "ai" },
    });
    await saveTags("task", task.id);
    return NextResponse.json({ capture: updatedCapture, task, usedAI });
  }

  const idea = await prisma.idea.create({
    data: {
      title: j.titolo,
      body: j.testo,
      voiceRaw: capture.raw,
      theme: j.tema || null,
      captureId: capture.id,
    },
  });
  await prisma.link.create({
    data: { fromType: "capture", fromId: capture.id, toType: "idea", toId: idea.id, relation: "from_capture", createdBy: "ai" },
  });
  await saveTags("idea", idea.id);

  // Connessioni proposte: "somiglia a X — collegare?" (spec §3.1).
  const others = await prisma.idea.findMany({ where: { id: { not: idea.id } } });
  const similar = others
    .map((o) => ({ idea: o, score: similarity(idea.title + " " + (idea.body || ""), o.title + " " + (o.body || "")) }))
    .filter((s) => s.score >= 0.34)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((s) => ({ id: s.idea.id, title: s.idea.title }));

  return NextResponse.json({ capture: updatedCapture, idea, similar, usedAI });
}
