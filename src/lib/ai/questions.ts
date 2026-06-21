import { aiComplete, parseJSON } from "@/lib/ai/client";
import { anonymizeForAI } from "@/lib/anonymize";
import { FALLBACK_DYNAMIC_QUESTIONS } from "@/lib/checkinSteps";
import type { LiveCheckInType } from "@/types";

interface PatternLite {
  patternType: string;
  description: string;
}

/**
 * Generates 1-2 dynamic check-in questions from anonymized patterns.
 * Falls back to a fixed local set when AI is unavailable (spec §15).
 */
export async function generateDynamicQuestions(
  checkInType: LiveCheckInType,
  patterns: PatternLite[],
  recentQuestions: string[],
): Promise<string[]> {
  const fallback = FALLBACK_DYNAMIC_QUESTIONS[checkInType];

  const patternSummary = patterns
    .map((p) => `- ${p.patternType}: ${anonymizeForAI(p.description)}`)
    .join("\n");
  const recent = recentQuestions
    .slice(0, 20)
    .map((q) => `- ${anonymizeForAI(q)}`)
    .join("\n");

  const prompt = `Genera 2 domande per un check-in "${checkInType}".
Le domande devono favorire l'auto-osservazione, essere brevi, dirette, mai motivazionali.

Pattern rilevati (anonimi):
${patternSummary || "(nessun pattern significativo)"}

Domande già poste di recente — NON ripeterle né parafrasarle:
${recent || "(nessuna)"}

Rispondi SOLO con un array JSON di stringhe, es: ["domanda 1", "domanda 2"].`;

  const raw = await aiComplete(prompt, { maxTokens: 300 });
  const parsed = parseJSON<string[]>(raw);
  if (Array.isArray(parsed) && parsed.length > 0) {
    return parsed.filter((q) => typeof q === "string").slice(0, 2);
  }
  return fallback;
}
