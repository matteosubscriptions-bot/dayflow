import { aiComplete } from "@/lib/ai/client";

export type GenerationKind = "SOCIAL" | "EMAIL" | "ARTICLE" | "SPEECH";

const PROMPTS: Record<GenerationKind, string> = {
  SOCIAL: `Trasforma la nota in un post per i social (LinkedIn/Instagram): hook iniziale forte, corpo in paragrafi brevi, chiusura con una domanda alla community e 3-4 hashtag pertinenti. Tono personale e diretto, in prima persona.`,
  EMAIL: `Trasforma la nota in una email/newsletter pronta da inviare: oggetto (riga "Oggetto: ..."), apertura personale, corpo che sviluppa l'idea della nota, chiusura con un invito a rispondere. Tono caldo e professionale.`,
  ARTICLE: `Trasforma la nota in un articolo breve (400-600 parole) in markdown: titolo (# ...), introduzione, 2-3 sezioni con sottotitoli (## ...), conclusione. Sviluppa solo ciò che la nota contiene davvero.`,
  SPEECH: `Trasforma la nota in uno script parlato di 60-90 secondi (per video o speech): frasi corte, ritmo orale, un'idea per frase, apertura che aggancia nei primi 3 secondi, chiusura memorabile. Nessuna indicazione di regia, solo il testo da dire.`,
};

const FALLBACK: Record<GenerationKind, string> = {
  SOCIAL: "post social",
  EMAIL: "email",
  ARTICLE: "articolo",
  SPEECH: "script parlato",
};

export async function generateContent(
  kind: GenerationKind,
  noteText: string,
): Promise<{ content: string; ai: boolean }> {
  const result = await aiComplete(
    `${PROMPTS[kind]}\n\nNOTA:\n${noteText.slice(0, 8000)}\n\nRispondi solo con il contenuto finale, senza commenti.`,
    { maxTokens: 1500 },
  );
  if (result) return { content: result, ai: true };
  return {
    content: `⚠ Genera ${FALLBACK[kind]}: per questa funzione serve una ANTHROPIC_API_KEY nel file .env (o nelle variabili d'ambiente del deploy).\n\nBozza di partenza (contenuto della nota):\n\n${noteText}`,
    ai: false,
  };
}
