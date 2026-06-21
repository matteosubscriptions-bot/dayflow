// Anonymization for AI — applied SEMPRE before sending text to Claude (spec §6).
// No identifying data should ever reach the API.

export interface AnonymizationOptions {
  removeNames?: boolean; // default: true
  removePlaces?: boolean; // default: true
  removeNumbers?: boolean; // default: false (numbers help pattern detection)
  keepEmotionalContent?: boolean; // default: true (emotional content is the point)
}

// Common Italian/English filler words that look capitalized but aren't names.
const STOPWORDS = new Set(
  [
    "il", "lo", "la", "i", "gli", "le", "un", "uno", "una", "di", "a", "da",
    "in", "con", "su", "per", "tra", "fra", "e", "o", "ma", "se", "che", "non",
    "ho", "hai", "ha", "io", "tu", "lui", "lei", "noi", "voi", "loro", "mi",
    "ti", "ci", "vi", "oggi", "ieri", "domani", "the", "a", "an", "i", "and",
    "or", "but", "if", "to", "of", "in", "on", "with",
  ].map((w) => w.toLowerCase()),
);

// Relationship hints → contextual placeholder.
const RELATIONSHIP_HINTS: { re: RegExp; token: string }[] = [
  { re: /\b(collega|colleghi|capo|boss|manager)\b/gi, token: "[collega]" },
  { re: /\b(amico|amica|amici)\b/gi, token: "[amico]" },
  { re: /\b(partner|fidanzat[oa]|marito|moglie|compagn[oa])\b/gi, token: "[partner]" },
];

const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const PHONE_RE = /\b(?:\+?\d[\d\s().-]{6,}\d)\b/g;
// Place prepositions followed by a capitalized word → [luogo].
const PLACE_RE = /\b(a|in|da|verso|presso)\s+([A-ZÀ-Ý][a-zà-ÿ]+)/g;
// Standalone capitalized words mid-sentence → candidate proper nouns.
const PROPER_NOUN_RE = /(?<=\w[\s,.;:]\s*)([A-ZÀ-Ý][a-zà-ÿ]{2,})/g;

/**
 * Anonymizes free text before it is sent to the AI.
 */
export function anonymizeForAI(
  text: string,
  options: AnonymizationOptions = {},
): string {
  const {
    removeNames = true,
    removePlaces = true,
    removeNumbers = false,
  } = options;

  let out = text;

  // 1. Contacts always go.
  out = out.replace(EMAIL_RE, "[email]");
  out = out.replace(PHONE_RE, (m) => (m.replace(/\D/g, "").length >= 7 ? "[contatto]" : m));

  // 2. Relationship-aware substitutions first (more specific than generic names).
  for (const { re, token } of RELATIONSHIP_HINTS) {
    out = out.replace(re, token);
  }

  // 3. Places.
  if (removePlaces) {
    out = out.replace(PLACE_RE, (_m, prep) => `${prep} [luogo]`);
  }

  // 4. Remaining proper nouns → [persona].
  if (removeNames) {
    out = out.replace(PROPER_NOUN_RE, (match) =>
      STOPWORDS.has(match.toLowerCase()) ? match : "[persona]",
    );
  }

  // 5. Numbers (off by default — useful for patterns).
  if (removeNumbers) {
    out = out.replace(/\b\d+([.,]\d+)?\b/g, "[numero]");
  }

  return out.replace(/\s{2,}/g, " ").trim();
}

// ── Structured data anonymization ─────────────────────────────

export interface PatternData {
  events: { type: string; weekday: number; count: number }[];
  moodSeries?: number[];
  energySeries?: number[];
  routineCompletion?: number;
  taskDeferRate?: number;
}

export interface AnonymousPatternData {
  events: { type: string; weekday: number; frequency: number }[];
  moodTrend?: "up" | "stable" | "down";
  energyTrend?: "up" | "stable" | "down";
  routineCompletion?: number;
  taskDeferRate?: number;
}

function trend(series?: number[]): "up" | "stable" | "down" | undefined {
  if (!series || series.length < 2) return undefined;
  const half = Math.floor(series.length / 2);
  const first = series.slice(0, half);
  const last = series.slice(half);
  const avg = (a: number[]) => a.reduce((s, n) => s + n, 0) / a.length;
  const delta = avg(last) - avg(first);
  if (delta > 0.4) return "up";
  if (delta < -0.4) return "down";
  return "stable";
}

/**
 * For structured signals (mood/routine/task) send only type, frequency and
 * trend — never raw free text.
 */
export function anonymizeStructuredData(data: PatternData): AnonymousPatternData {
  return {
    events: data.events.map((e) => ({
      type: e.type,
      weekday: e.weekday,
      frequency: e.count,
    })),
    moodTrend: trend(data.moodSeries),
    energyTrend: trend(data.energySeries),
    routineCompletion: data.routineCompletion,
    taskDeferRate: data.taskDeferRate,
  };
}
