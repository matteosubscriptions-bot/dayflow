import { prisma } from "@/lib/prisma";
import { anonymizeStructuredData } from "@/lib/anonymize";
import { generateReportNarrative } from "@/lib/ai/narrative";
import { analyzeWeeklyPatterns } from "@/lib/patterns";

export interface ReportContent {
  routineHeatmap: { date: string; routineId: string; routineName: string; done: boolean }[];
  moodSeries: { date: string; mood: number; energy: number }[];
  taskStats: { completed: number; deferred: number; added: number };
  goalProgress: { title: string; progress: number }[];
  summary: {
    routineCompletionAvg: number;
    moodTrend: "up" | "stable" | "down";
    taskDeferRate: number;
    topStreaks: { habitName: string; days: number }[];
  };
}

/** Builds a structured report and an AI narrative (with graceful fallback). */
export async function buildReport(
  userId: string,
  type: "daily" | "weekly" | "monthly",
  periodStart: Date,
  periodEnd: Date,
): Promise<{ content: ReportContent; narrative: string | null }> {
  const range = { gte: periodStart, lte: periodEnd };

  const [routines, routineLogs, moods, tasks, goals, weekly] = await Promise.all([
    prisma.routine.findMany({ where: { userId, isActive: true } }),
    prisma.routineLog.findMany({ where: { userId, date: range } }),
    prisma.mood.findMany({ where: { userId, date: range }, orderBy: { date: "asc" } }),
    prisma.task.findMany({ where: { userId, createdAt: range } }),
    prisma.goal.findMany({ where: { userId, status: "active" } }),
    analyzeWeeklyPatterns(userId),
  ]);

  const routineHeatmap = routineLogs
    .filter((l) => l.routineId)
    .map((l) => {
      const r = routines.find((x) => x.id === l.routineId);
      return {
        date: l.date.toISOString().slice(0, 10),
        routineId: l.routineId!,
        routineName: r?.name ?? "Routine",
        done: l.done,
      };
    });

  const moodSeries = moods.map((m) => ({
    date: m.date.toISOString().slice(0, 10),
    mood: m.intensity ?? 3,
    energy: m.energy ?? 5,
  }));

  const taskStats = {
    completed: tasks.filter((t) => t.status === "done").length,
    deferred: tasks.filter((t) => t.deferCount > 0).length,
    added: tasks.length,
  };

  const goalProgress = goals.map((g) => ({ title: g.title, progress: g.progress }));

  const content: ReportContent = {
    routineHeatmap,
    moodSeries,
    taskStats,
    goalProgress,
    summary: {
      routineCompletionAvg: weekly.summary.routineCompletionAvg,
      moodTrend: weekly.summary.moodTrend,
      taskDeferRate: weekly.summary.taskDeferRate,
      topStreaks: weekly.summary.topStreaks,
    },
  };

  const narrative =
    type === "daily"
      ? null
      : await generateReportNarrative(
          {
            routineCompletionAvg: content.summary.routineCompletionAvg,
            moodTrend: content.summary.moodTrend,
            taskDeferRate: content.summary.taskDeferRate,
            topStreaks: content.summary.topStreaks,
            patterns: anonymizeStructuredData({
              events: [],
              moodSeries: moodSeries.map((m) => m.mood),
              energySeries: moodSeries.map((m) => m.energy),
              routineCompletion: content.summary.routineCompletionAvg,
              taskDeferRate: content.summary.taskDeferRate,
            }),
            lowMoodPeriod: content.summary.moodTrend === "down",
          },
          type,
        );

  return { content, narrative };
}
