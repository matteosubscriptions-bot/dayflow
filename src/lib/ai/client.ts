import Anthropic from "@anthropic-ai/sdk";
import { APP_NAME } from "@/lib/brand";

export const AI_MODEL = "claude-sonnet-4-6";

export const SYSTEM_PROMPT = `Sei il motore di elaborazione di ${APP_NAME}, un archivio personale di idee e note vocali.
Ricevi trascrizioni e appunti dell'utente. Lavori in italiano (a meno che la nota non sia in un'altra lingua).
Sii concreto, fedele al contenuto della nota, mai generico. Non inventare fatti che la nota non contiene.`;

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

type ChatMessage = { role: "user" | "assistant"; content: string };

/**
 * Single entry point for text generation. Returns null on any failure so
 * callers can fall back gracefully — never block a flow on AI.
 */
export async function aiComplete(
  userPrompt: string | ChatMessage[],
  opts: { maxTokens?: number; system?: string } = {},
): Promise<string | null> {
  const ai = getAIClient();
  if (!ai) return null;
  try {
    const messages: ChatMessage[] =
      typeof userPrompt === "string"
        ? [{ role: "user", content: userPrompt }]
        : userPrompt;
    const res = await ai.messages.create({
      model: AI_MODEL,
      max_tokens: opts.maxTokens ?? 1024,
      system: opts.system ?? SYSTEM_PROMPT,
      messages,
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
