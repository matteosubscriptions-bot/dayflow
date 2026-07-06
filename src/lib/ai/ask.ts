import { aiComplete } from "@/lib/ai/client";

export interface AskSource {
  id: string;
  title: string;
  text: string;
}

/**
 * "Chiedi al tuo cervello": risponde a una domanda usando le note più
 * pertinenti come contesto. Senza chiave AI restituisce null (il chiamante
 * mostra comunque le note trovate).
 */
export async function askBrain(
  question: string,
  sources: AskSource[],
): Promise<string | null> {
  if (sources.length === 0) return null;
  const context = sources
    .map((s, i) => `[${i + 1}] "${s.title}"\n${s.text.slice(0, 1500)}`)
    .join("\n\n---\n\n");

  return aiComplete(
    `L'utente interroga il proprio archivio di note personali.

DOMANDA: ${question}

NOTE PIÙ PERTINENTI DELL'ARCHIVIO:
${context}

Rispondi alla domanda basandoti SOLO su queste note. Cita le note per titolo quando le usi (es. «in "Il mio metodo di lavoro" scrivevi che…»). Se le note non contengono una risposta, dillo onestamente e suggerisci quale nota andrebbe creata. Rispondi in italiano, 3-8 frasi.`,
    { maxTokens: 800 },
  );
}
