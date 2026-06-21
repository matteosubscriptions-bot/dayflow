import type { CheckInStep, LiveCheckInType } from "@/types";

// Fixed check-in step templates (spec §10). Dynamic AI questions are
// appended to these at runtime; these are also the offline fallback set.

export const MORNING_STEPS: CheckInStep[] = [
  {
    id: "m-mood",
    questionKey: "mood",
    questionText: "Come ti senti, appena sveglio?",
    isDynamic: false,
    inputType: "mood_picker",
    isSkippable: false,
  },
  {
    id: "m-intention",
    questionKey: "intention",
    questionText: "Qual è l'intenzione per oggi?",
    isDynamic: false,
    inputType: "voice",
    isSkippable: true,
    moodAdaptation: {
      low: { questionText: "Una sola cosa gentile che puoi fare per te oggi?" },
      high: { questionText: "Cosa renderebbe oggi una giornata che ricorderai?" },
    },
  },
  {
    id: "m-top3",
    questionKey: "top3",
    questionText: "Le 3 cose che contano di più oggi?",
    isDynamic: false,
    inputType: "task_list",
    isSkippable: true,
    moodAdaptation: {
      low: { questionText: "Una sola cosa che conta oggi. Basta quella." },
    },
  },
];

export const MIDDAY_STEPS: CheckInStep[] = [
  {
    id: "d-mood",
    questionKey: "mood",
    questionText: "Come va la giornata, finora?",
    isDynamic: false,
    inputType: "mood_picker",
    isSkippable: false,
  },
  {
    id: "d-progress",
    questionKey: "progress",
    questionText: "Cosa hai mosso, anche di poco?",
    isDynamic: false,
    inputType: "voice",
    isSkippable: true,
    moodAdaptation: {
      high: { questionText: "Dove stai avendo più impatto, in questo momento?" },
    },
  },
  {
    id: "d-adjust",
    questionKey: "adjust",
    questionText: "Cosa cambieresti per il resto della giornata?",
    isDynamic: false,
    inputType: "voice",
    isSkippable: true,
  },
];

export const EVENING_STEPS: CheckInStep[] = [
  {
    id: "e-mood",
    questionKey: "mood",
    questionText: "Come ti senti, ora che la giornata finisce?",
    isDynamic: false,
    inputType: "mood_picker",
    isSkippable: false,
  },
  {
    id: "e-win",
    questionKey: "win",
    questionText: "Una vittoria di oggi, anche minima?",
    isDynamic: false,
    inputType: "voice",
    isSkippable: true,
    moodAdaptation: {
      low: { questionText: "Una cosa, una sola, che è andata. Anche piccolissima." },
    },
  },
  {
    id: "e-habits",
    questionKey: "habits",
    questionText: "Cosa hai coltivato oggi?",
    isDynamic: false,
    inputType: "habit_checklist",
    isSkippable: true,
  },
  {
    id: "e-learn",
    questionKey: "learn",
    questionText: "Cosa ti porti via da oggi?",
    isDynamic: false,
    inputType: "voice",
    isSkippable: true,
    moodAdaptation: {
      high: { questionText: "Cosa hai capito oggi che ieri non sapevi?" },
    },
  },
];

export function getStepsForType(type: LiveCheckInType): CheckInStep[] {
  switch (type) {
    case "morning":
      return MORNING_STEPS;
    case "midday":
      return MIDDAY_STEPS;
    case "evening":
      return EVENING_STEPS;
  }
}

// Fixed fallback dynamic questions, used when the AI is unavailable.
export const FALLBACK_DYNAMIC_QUESTIONS: Record<LiveCheckInType, string[]> = {
  morning: [
    "Cosa stai evitando, che oggi potresti affrontare?",
    "A chi vuoi dedicare attenzione vera, oggi?",
  ],
  midday: [
    "L'energia di stamattina dov'è andata?",
    "Cosa ti sta distraendo dall'essenziale?",
  ],
  evening: [
    "Cosa avresti voluto fare diversamente?",
    "Per cosa, oggi, provi gratitudine sincera?",
  ],
};

// Quick check-in (60 seconds, spec §10).
export const QUICK_STEPS: CheckInStep[] = [
  {
    id: "q-mood",
    questionKey: "mood",
    questionText: "Come stai, adesso?",
    isDynamic: false,
    inputType: "mood_picker",
    isSkippable: false,
  },
  {
    id: "q-win",
    questionKey: "win",
    questionText: "Una vittoria, anche minima?",
    isDynamic: false,
    inputType: "voice",
    isSkippable: true,
  },
  {
    id: "q-success",
    questionKey: "success",
    questionText: "La UNICA cosa che renderebbe oggi un successo?",
    isDynamic: false,
    inputType: "voice",
    isSkippable: true,
  },
];
