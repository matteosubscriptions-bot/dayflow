// Ricerca trasversale su idee, task, grezzi, progetti e obiettivi.
// Testuale (ILIKE, case-insensitive); la semantica su embeddings è
// un'estensione futura — per un archivio personale questa regge.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ results: [] });
  const like = { contains: q, mode: "insensitive" as const };

  const [ideas, tasks, captures, projects, goals] = await Promise.all([
    prisma.idea.findMany({
      where: { OR: [{ title: like }, { body: like }, { theme: like }] },
      take: 20,
    }),
    prisma.task.findMany({ where: { title: like, status: { not: "archived" } }, take: 20 }),
    prisma.capture.findMany({ where: { raw: like }, take: 20, orderBy: { createdAt: "desc" } }),
    prisma.project.findMany({ where: { OR: [{ name: like }, { description: like }] }, take: 10 }),
    prisma.lifeGoal.findMany({ where: { OR: [{ title: like }, { whyDeep: like }] }, take: 10 }),
  ]);

  const results = [
    ...ideas.map((i) => ({ kind: "Idea", id: i.id, text: i.title, sub: i.theme || undefined })),
    ...tasks.map((t) => ({ kind: "Task", id: t.id, text: t.title, sub: t.status })),
    ...projects.map((p) => ({ kind: "Progetto", id: p.id, text: p.name })),
    ...goals.map((g) => ({ kind: "Obiettivo", id: g.id, text: g.title })),
    ...captures.map((c) => ({
      kind: "Grezzo", id: c.id,
      text: c.raw.length > 100 ? c.raw.slice(0, 100) + "…" : c.raw,
      sub: c.createdAt.toISOString().slice(0, 10),
    })),
  ];
  return NextResponse.json({ results });
}
