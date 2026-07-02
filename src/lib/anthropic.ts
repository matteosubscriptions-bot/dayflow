// Client AI server-side. Il cloud è un servizio a chiamata, mai il custode
// dei dati: riceve solo il testo minimo necessario. Senza ANTHROPIC_API_KEY
// ogni funzione ha un fallback locale — l'app non si rompe mai per l'AI.

import Anthropic from "@anthropic-ai/sdk";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

export const aiAvailable = () => Boolean(process.env.ANTHROPIC_API_KEY);

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export type ChatMsg = { role: "user" | "assistant"; content: string };

export async function chiamaAI(system: string, messages: ChatMsg[], maxTokens = 1000): Promise<string> {
  const res = await getClient().messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages,
  });
  return res.content
    .filter((c): c is Anthropic.TextBlock => c.type === "text")
    .map((c) => c.text)
    .join("\n")
    .trim();
}

// ── Fallback locali (senza rete/chiave) ──────────────────────

// Elaborazione euristica del grezzo: titolo dalle prime parole, testo
// ripulito da riempitivi comuni del parlato.
export function elaborateFallback(raw: string, tipo: "task" | "idea") {
  const clean = raw
    .replace(/\b(allora|cioè|ehm|mmm|insomma|praticamente|diciamo)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  const words = clean.split(" ");
  const titolo = words.slice(0, 8).join(" ") + (words.length > 8 ? "…" : "");
  return {
    titolo: titolo.charAt(0).toUpperCase() + titolo.slice(1),
    testo: clean,
    tipo,
    tags: [] as string[],
    urgenza: 3,
    importanza: 3,
    tema: null as string | null,
  };
}

// Dialogo offline: domande aperte generiche, una per volta.
const FALLBACK_QUESTIONS = [
  "Sono offline in questo momento, ma resto qui. Cosa c'era davvero in quel momento?",
  "Sono offline, ma la tua osservazione è salvata. Quando l'avevi già sentito, questo?",
  "Sono offline ora. Se vuoi continuare lo stesso: cosa protegge questo comportamento?",
];

export function dialogueFallback(turnCount: number): string {
  return FALLBACK_QUESTIONS[Math.min(Math.floor(turnCount / 2), FALLBACK_QUESTIONS.length - 1)];
}
