import { aiComplete } from "@/lib/ai/client";
import type { AnonymousPatternData } from "@/lib/anonymize";

export interface AnonymousReportData {
  routineCompletionAvg: number;
  moodTrend: "up" | "stable" | "down";
  taskDeferRate: number;
  topStreaks: { habitName: string; days: number }[];
  patterns: AnonymousPatternData;
  lowMoodPeriod: boolean;
}

/**
 * Produces a reflective narrative from aggregated, anonymous statistics —
 * never raw journal entries. Returns null on failure so the report renders
 * structured-only (spec §15).
 */
export async function generateReportNarrative(
  reportData: AnonymousReportData,
  period: "weekly" | "monthly",
): Promise<string | null> {
  const periodLabel = period === "weekly" ? "settimana" : "mese";
  const streaks = reportData.topStreaks
    .map((s) => `${s.habitName} (${s.days}gg)`)
    .join(", ");

  const prompt = `Scrivi una narrativa riflessiva per la ${periodLabel} appena trascorsa.
Dati aggregati anonimi:
- Completamento routine: ${Math.round(reportData.routineCompletionAvg * 100)}%
- Trend umore: ${reportData.moodTrend}
- Tasso rinvio task: ${Math.round(reportData.taskDeferRate * 100)}%
- Streak migliori: ${streaks || "nessuna"}
- Periodo con umore basso: ${reportData.lowMoodPeriod ? "sì" : "no"}

Scrivi 2-3 paragrafi brevi. Specchio sui pattern, non giudizio. ${
    reportData.lowMoodPeriod
      ? "L'umore è stato basso: tono morbido, nessuna statistica giudicante."
      : ""
  } Niente frasi motivazionali.`;

  return aiComplete(prompt, { maxTokens: 700 });
}
