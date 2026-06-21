import { subDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import type { WeeklySummary } from "@/types";

/**
 * Computes behavioural patterns for the last 7 days from stored data only
 * (no AI, no free text). Persists notable patterns and returns a summary.
 */
export async function analyzeWeeklyPatterns(userId: string): Promise<{
  summary: WeeklySummary;
  patterns: { patternType: string; description: string }[];
}> {
  const now = new Date();
  const weekAgo = subDays(now, 7);
  const twoWeeksAgo = subDays(now, 14);

  const [moods, routineLogs, routines, tasksRecent] = await Promise.all([
    prisma.mood.findMany({
      where: { userId, date: { gte: twoWeeksAgo } },
      orderBy: { date: "asc" },
    }),
    prisma.routineLog.findMany({
      where: { userId, date: { gte: weekAgo } },
    }),
    prisma.routine.findMany({ where: { userId, isActive: true } }),
    prisma.task.findMany({
      where: { userId, createdAt: { gte: weekAgo } },
    }),
  ]);

  const detected: { patternType: string; description: string; dataJson?: string }[] = [];

  // ── Routine completion ──
  const expected = routines.length * 7 || 1;
  const completed = routineLogs.filter((l) => l.done).length;
  const routineCompletionAvg = Math.min(1, completed / expected);

  // ── Mood trend (compare last week vs the week before) ──
  const thisWeekMoods = moods.filter((m) => m.date >= weekAgo);
  const lastWeekMoods = moods.filter((m) => m.date < weekAgo);
  const avg = (arr: number[]) =>
    arr.length ? arr.reduce((s, n) => s + n, 0) / arr.length : 0;
  const thisAvg = avg(thisWeekMoods.map((m) => m.intensity ?? 3));
  const lastAvg = avg(lastWeekMoods.map((m) => m.intensity ?? 3));
  let moodTrend: "up" | "stable" | "down" = "stable";
  if (lastWeekMoods.length) {
    if (thisAvg - lastAvg > 0.4) moodTrend = "up";
    else if (thisAvg - lastAvg < -0.4) moodTrend = "down";
  }
  if (moodTrend === "down") {
    detected.push({
      patternType: "mood_drop",
      description: "L'umore medio è calato rispetto alla settimana precedente.",
    });
  }

  // ── Task defer rate ──
  const deferred = tasksRecent.filter((t) => t.deferCount > 0).length;
  const taskDeferRate = tasksRecent.length ? deferred / tasksRecent.length : 0;
  const heavyDeferrals = tasksRecent.filter((t) => t.deferCount >= 3);
  if (heavyDeferrals.length > 0) {
    detected.push({
      patternType: "task_defer",
      description: `${heavyDeferrals.length} task rimandati 3 o più volte.`,
    });
  }

  // ── Streaks per habit ──
  const habitLogs = await prisma.routineLog.findMany({
    where: { userId, habitId: { not: null }, done: true, date: { gte: subDays(now, 60) } },
    include: { habit: true },
    orderBy: { date: "desc" },
  });
  const byHabit = new Map<string, { name: string; dates: Set<string> }>();
  for (const log of habitLogs) {
    if (!log.habitId || !log.habit) continue;
    const entry = byHabit.get(log.habitId) ?? { name: log.habit.name, dates: new Set<string>() };
    entry.dates.add(log.date.toISOString().slice(0, 10));
    byHabit.set(log.habitId, entry);
  }
  const topStreaks: { habitName: string; days: number }[] = [];
  for (const { name, dates } of byHabit.values()) {
    let streak = 0;
    for (let i = 0; i < 60; i++) {
      const day = subDays(now, i).toISOString().slice(0, 10);
      if (dates.has(day)) streak++;
      else if (i > 0) break;
    }
    if (streak >= 3) {
      topStreaks.push({ habitName: name, days: streak });
      detected.push({
        patternType: "streak_positive",
        description: `Streak di ${streak} giorni su un'abitudine.`,
      });
    }
  }
  topStreaks.sort((a, b) => b.days - a.days);

  const warnings = detected
    .filter((p) => p.patternType !== "streak_positive")
    .map((p) => ({ type: p.patternType, description: p.description }));

  // Persist freshly detected patterns.
  if (detected.length) {
    await prisma.pattern.createMany({
      data: detected.map((p) => ({
        userId,
        patternType: p.patternType,
        description: p.description,
        periodStart: weekAgo,
        periodEnd: now,
      })),
    });
  }

  return {
    summary: {
      routineCompletionAvg,
      moodTrend,
      taskDeferRate,
      topStreaks: topStreaks.slice(0, 5),
      warnings,
    },
    patterns: detected.map((p) => ({
      patternType: p.patternType,
      description: p.description,
    })),
  };
}
