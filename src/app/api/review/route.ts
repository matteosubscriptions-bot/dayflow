// Review settimanale: numeri calcolati localmente + eventuale narrativa
// AI (specchio, non pagella). Salvata come Report riusabile.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { chiamaAI, aiAvailable } from "@/lib/anthropic";
import { SYS_REVIEW } from "@/lib/agents";

export const dynamic = "force-dynamic";

export async function GET() {
  const end = new Date();
  const start = new Date(end.getTime() - 7 * 86400000);
  const startDate = start.toISOString().slice(0, 10);
  const endDate = end.toISOString().slice(0, 10);

  const [doneTasks, deferredTasks, moods, habitLogs, habits] = await Promise.all([
    prisma.task.findMany({ where: { status: "done", completedAt: { gte: start } } }),
    prisma.task.findMany({ where: { status: "todo", deferredCount: { gte: 1 } } }),
    prisma.mood.findMany({ where: { date: { gte: startDate } } }),
    prisma.habitLog.findMany({ where: { date: { gte: startDate }, done: true } }),
    prisma.habit.findMany({ where: { isActive: true } }),
  ]);

  const avg = (xs: number[]) =>
    xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null;
  const moodVals = moods.map((m) => m.moodIntensity).filter((x): x is number => x != null);
  const energyVals = moods.map((m) => m.energy).filter((x): x is number => x != null);

  const content = {
    periodStart: startDate,
    periodEnd: endDate,
    tasksDone: doneTasks.length,
    tasksDeferred: deferredTasks.length,
    moodAvg: avg(moodVals),
    energyAvg: avg(energyVals),
    checkIns: moods.length,
    habitCompletions: habitLogs.length,
    activeHabits: habits.length,
  };

  let narrative: string | null = null;
  if (aiAvailable()) {
    try {
      narrative = await chiamaAI(SYS_REVIEW, [
        { role: "user", content: `Settimana ${startDate} → ${endDate}: ${JSON.stringify(content)}` },
      ], 300);
    } catch {
      narrative = null;
    }
  }

  const report = await prisma.report.create({
    data: { type: "weekly", periodStart: startDate, periodEnd: endDate, contentJson: content, narrative },
  });
  return NextResponse.json(report);
}
