// Health check leggero: connessione DB (con latenza), conteggi tabelle,
// stato AI (chiave presente o modalità fallback), versione e ambiente.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { aiAvailable } from "@/lib/anthropic";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, unknown> = {};
  let dbOk = false;
  let dbMs = 0;

  try {
    const t0 = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbMs = Date.now() - t0;
    dbOk = true;
  } catch (e) {
    checks.dbError = e instanceof Error ? e.message : String(e);
  }

  let counts: Record<string, number> | null = null;
  if (dbOk) {
    try {
      const [captures, tasks, ideas, projects, goals, dialogues, moods, habits, traits, links] =
        await Promise.all([
          prisma.capture.count(),
          prisma.task.count(),
          prisma.idea.count(),
          prisma.project.count(),
          prisma.lifeGoal.count(),
          prisma.dialogue.count(),
          prisma.mood.count(),
          prisma.habit.count(),
          prisma.profileTrait.count(),
          prisma.link.count(),
        ]);
      counts = { captures, tasks, ideas, projects, goals, dialogues, moods, habits, traits, links };
    } catch (e) {
      checks.countsError = e instanceof Error ? e.message : String(e);
    }
  }

  return NextResponse.json({
    ok: dbOk,
    time: new Date().toISOString(),
    db: { ok: dbOk, latencyMs: dbMs, url: process.env.DATABASE_URL ? "impostato" : "MANCANTE" },
    ai: {
      enabled: aiAvailable(),
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
      mode: aiAvailable() ? "cloud" : "fallback locale (nessuna chiave)",
    },
    counts,
    env: {
      nodeVersion: process.version,
      nextEnv: process.env.NODE_ENV,
    },
    ...checks,
  });
}
