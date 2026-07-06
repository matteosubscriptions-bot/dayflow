import { aiComplete, parseJSON } from "@/lib/ai/client";

export type Todo = { text: string; done: boolean };

/** Prime frasi del testo, usate come fallback locale del riassunto. */
function firstSentences(text: string, count = 2): string {
  const sentences = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 0);
  return sentences.slice(0, count).join(" ").trim();
}

export async function summarize(text: string): Promise<string> {
  const ai = await aiComplete(
    `Riassumi questa nota in 2-4 frasi, in prima persona come se fosse l'autore a rileggersi. Solo il riassunto, nessun preambolo.\n\nNOTA:\n${text}`,
    { maxTokens: 400 },
  );
  return ai ?? firstSentences(text, 3);
}

export async function extractKeyPoints(text: string): Promise<string[]> {
  const ai = await aiComplete(
    `Estrai i punti chiave di questa nota (da 3 a 6). Rispondi SOLO con un array JSON di stringhe, es. ["punto uno","punto due"].\n\nNOTA:\n${text}`,
    { maxTokens: 500 },
  );
  const parsed = parseJSON<string[]>(ai);
  if (parsed && Array.isArray(parsed) && parsed.length > 0) {
    return parsed.map((p) => String(p)).slice(0, 8);
  }
  // Fallback locale: frasi più lunghe della nota.
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 40)
    .slice(0, 4);
}

export async function extractTodos(text: string): Promise<Todo[]> {
  const ai = await aiComplete(
    `Trasforma questa nota in una todo list di azioni concrete (da 2 a 8 voci, verbi all'infinito). Rispondi SOLO con un array JSON di stringhe.\n\nNOTA:\n${text}`,
    { maxTokens: 500 },
  );
  const parsed = parseJSON<string[]>(ai);
  const items =
    parsed && Array.isArray(parsed) && parsed.length > 0
      ? parsed.map((p) => String(p))
      : // Fallback locale: righe che sembrano azioni.
        text
          .split(/[\n.]+/)
          .map((s) => s.trim())
          .filter((s) => /^(devo|voglio|potrei|vorrei|fare|creare|scrivere|preparare|inviare|chiamare|organizzare|provare)/i.test(s))
          .slice(0, 6);
  return items.slice(0, 10).map((t) => ({ text: t, done: false }));
}

/** Titolo + tag suggeriti alla creazione di una nota. */
export async function titleAndTags(
  text: string,
  existingTags: string[],
): Promise<{ title: string; tags: string[] }> {
  const ai = await aiComplete(
    `Per questa nota genera:
- "title": un titolo breve ed evocativo (max 8 parole, niente punto finale)
- "tags": 1-3 tag (parole singole, maiuscole, senza #). Preferisci i tag esistenti se pertinenti: ${existingTags.join(", ") || "nessuno"}.
Rispondi SOLO con JSON: {"title": "...", "tags": ["..."]}.

NOTA:
${text.slice(0, 4000)}`,
    { maxTokens: 200 },
  );
  const parsed = parseJSON<{ title?: string; tags?: string[] }>(ai);
  if (parsed?.title) {
    return {
      title: String(parsed.title).slice(0, 120),
      tags: (parsed.tags ?? [])
        .map((t) => String(t).toUpperCase().replace(/[^A-Z0-9]/g, ""))
        .filter(Boolean)
        .slice(0, 3),
    };
  }
  // Fallback locale: prime parole della nota.
  const words = text.replace(/\s+/g, " ").trim().split(" ").slice(0, 7).join(" ");
  return { title: words ? `${words}…` : "Senza titolo", tags: [] };
}
