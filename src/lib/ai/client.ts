import Anthropic from "@anthropic-ai/sdk";

export const AI_MODEL = "claude-sonnet-4-6";

export const SYSTEM_PROMPT = `Sei il motore di analisi di DayFlow, un journal coach per la crescita personale.
Ricevi dati anonimi sull'utente. Non hai accesso a nomi, luoghi o dettagli identificativi.
Il tuo ruolo è: identificare pattern comportamentali, generare domande che aiutino l'auto-osservazione,
e produrre narrativa riflessiva — mai motivazionale o superficiale.

Tono: diretto, umano, mai terapeutico. Non incoraggiare ("ottimo lavoro!").
Tre registri: Riflessione (rallenta e guarda in profondità) / Osservazione (specchio sui pattern) /
Ispirazione autentica (attiva qualcosa di vero, non motivazione vuota).

Se l'utente ha umore basso nel periodo analizzato: domande più morbide, nessuna statistica giudicante.`;

let client: Anthropic | null = null;

export function getAIClient(): Anthropic | null {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  if (!client) client = new Anthropic({ apiKey: key });
  return client;
}

export function isAIEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * Single entry point for text generation. Returns null on any failure so
 * callers can fall back gracefully (spec §15 — never block a flow on AI).
 */
export async function aiComplete(
  userPrompt: string,
  opts: { maxTokens?: number; system?: string } = {},
): Promise<string | null> {
  const ai = getAIClient();
  if (!ai) return null;
  try {
    const res = await ai.messages.create({
      model: AI_MODEL,
      max_tokens: opts.maxTokens ?? 1024,
      system: opts.system ?? SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });
    const block = res.content.find((b) => b.type === "text");
    return block && block.type === "text" ? block.text.trim() : null;
  } catch (err) {
    console.error("[ai] completion failed:", err);
    return null;
  }
}

/** Best-effort JSON extraction from a model response. */
export function parseJSON<T>(text: string | null): T | null {
  if (!text) return null;
  try {
    const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    return JSON.parse(match ? match[0] : text) as T;
  } catch {
    return null;
  }
}
