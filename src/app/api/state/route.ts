// Stato completo dell'app in una chiamata: utente singolo, dataset
// personale — caricare tutto all'avvio è più semplice e robusto di
// N endpoint paginati (spec §13: la soluzione più semplice che regge).

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const [captures, links, goals, projects, tasks, ideas, dialogues, moods, habits, habitLogs, traits] =
    await Promise.all([
      prisma.capture.findMany({ orderBy: { createdAt: "desc" }, take: 300 }),
      prisma.link.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.lifeGoal.findMany({ orderBy: { createdAt: "asc" } }),
      prisma.project.findMany({ orderBy: { createdAt: "asc" } }),
      prisma.task.findMany({ orderBy: { createdAt: "asc" } }),
      prisma.idea.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.dialogue.findMany({ orderBy: { startedAt: "desc" }, take: 50 }),
      prisma.mood.findMany({ orderBy: [{ date: "desc" }, { createdAt: "desc" }], take: 120 }),
      prisma.habit.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.habitLog.findMany({ orderBy: { date: "desc" }, take: 500 }),
      prisma.profileTrait.findMany({ orderBy: { detectedAt: "desc" } }),
    ]);

  return NextResponse.json({
    captures, links, goals, projects, tasks, ideas, dialogues, moods, habits, habitLogs, traits,
  });
}
