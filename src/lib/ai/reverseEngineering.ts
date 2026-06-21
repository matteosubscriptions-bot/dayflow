import { aiComplete, parseJSON } from "@/lib/ai/client";
import { anonymizeForAI } from "@/lib/anonymize";
import type { GoalHierarchy } from "@/types";

/**
 * Reverse-engineers a goal into milestones, monthly focus, weekly actions and
 * suggested tasks. The title/area/horizon may stay; the deep "why" is
 * anonymized. Returns an editable template on AI failure (spec §15).
 */
export async function generateGoalReverseEngineering(
  goalTitle: string,
  area: string,
  horizon: string,
  whyDeep: string,
): Promise<GoalHierarchy> {
  const prompt = `Un utente vuole raggiungere questo obiettivo entro ${horizon} (area: ${area}):
"${goalTitle}"

Il perché profondo (anonimizzato): "${anonymizeForAI(whyDeep)}"

Scomponi l'obiettivo con reverse engineering. Rispondi SOLO con JSON in questa forma:
{
  "milestones": [{"title": "...", "horizon": "3m", "kpi": "..."}],   // 4 milestone trimestrali
  "monthlyFocus": ["...", "..."],                                     // 3-5 azioni del primo mese
  "weeklyActions": ["...", "..."],                                    // 2-4 azioni della settimana
  "tomorrowTasks": ["...", "..."]                                     // task concreti per domani
}`;

  const raw = await aiComplete(prompt, { maxTokens: 1200 });
  const parsed = parseJSON<GoalHierarchy>(raw);
  if (parsed && Array.isArray(parsed.milestones)) {
    return {
      milestones: parsed.milestones ?? [],
      monthlyFocus: parsed.monthlyFocus ?? [],
      weeklyActions: parsed.weeklyActions ?? [],
      tomorrowTasks: parsed.tomorrowTasks ?? [],
    };
  }

  // Editable standard template fallback.
  return {
    milestones: [
      { title: `${goalTitle} — primo trimestre: fondamenta`, horizon: "3m" },
      { title: `${goalTitle} — secondo trimestre: costruzione`, horizon: "3m" },
      { title: `${goalTitle} — terzo trimestre: consolidamento`, horizon: "3m" },
      { title: `${goalTitle} — quarto trimestre: traguardo`, horizon: "3m" },
    ],
    monthlyFocus: [
      "Definisci la prima azione misurabile del mese",
      "Individua l'ostacolo principale e un modo per ridurlo",
      "Crea una routine settimanale che serve questo obiettivo",
    ],
    weeklyActions: [
      "Un blocco di tempo dedicato questa settimana",
      "Un piccolo passo verificabile entro domenica",
    ],
    tomorrowTasks: ["Il primo passo concreto, anche minimo, per domani"],
  };
}
