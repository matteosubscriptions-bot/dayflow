// Similarità testuale locale (TF-IDF + coseno): alimenta ricerca semantica,
// grafo delle connessioni e recupero note per "Chiedi al tuo cervello".
// Nessun servizio esterno: tutto calcolato sul server dai vettori salvati.

export type TermVector = Record<string, number>;

// Stopword essenziali IT + EN (le note possono mescolare le due lingue).
const STOPWORDS = new Set(
  (
    "a ad al allo ai agli alla alle anche ancora avere aveva b c che chi ci coi col come con contro cui d da dal dallo dai dagli dalla dalle de dei degli della delle di dove e ed era erano essere fa fare fatto fra gia gli ha hanno ho i il in io l la le lei li lo loro lui ma me mi mia mie miei mio molto ne nei nel nella nelle noi non nostra nostro o ogni oppure ora per perche piu poco poi pero qua quale quando quanto quasi quella quelle quelli quello questa queste questi questo qui se sei sempre senza si sia siamo solo sono sopra sotto sta stata state stati stato su sua sue sui sul sulla sulle suo suoi te ti tra tu tua tue tuo tuoi tutta tutte tutti tutto un una uno vi via voi vostra vostro" +
    " the a an and or but if of at by for with about into to from in on is are was were be been being have has had do does did not no yes it its this that these those i you he she we they them his her their our your my me us what which who whom how when where why all any both each few more most other some such only own same so than too very can will just should now"
  ).split(/\s+/),
);

/** Tokenizza: minuscole, senza accenti, solo parole >2 caratteri, no stopword. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

/** Vettore term-frequency di un testo (salvato in Note.tfVector). */
export function termVector(text: string): TermVector {
  const vec: TermVector = {};
  for (const tok of tokenize(text)) vec[tok] = (vec[tok] ?? 0) + 1;
  return vec;
}

/** IDF calcolato sull'intero corpus di vettori (poche migliaia di note: ok a runtime). */
export function idfMap(vectors: TermVector[]): Map<string, number> {
  const df = new Map<string, number>();
  for (const vec of vectors) {
    for (const term of Object.keys(vec)) df.set(term, (df.get(term) ?? 0) + 1);
  }
  const n = Math.max(vectors.length, 1);
  const idf = new Map<string, number>();
  df.forEach((count, term) => idf.set(term, Math.log(1 + n / count)));
  return idf;
}

function weight(vec: TermVector, idf: Map<string, number>): Map<string, number> {
  const w = new Map<string, number>();
  let norm = 0;
  for (const [term, tf] of Object.entries(vec)) {
    const v = (1 + Math.log(tf)) * (idf.get(term) ?? 0);
    if (v > 0) {
      w.set(term, v);
      norm += v * v;
    }
  }
  norm = Math.sqrt(norm) || 1;
  w.forEach((v, k) => w.set(k, v / norm));
  return w;
}

/** Coseno fra due vettori TF, pesati con l'IDF del corpus. */
export function cosine(
  a: TermVector,
  b: TermVector,
  idf: Map<string, number>,
): number {
  const wa = weight(a, idf);
  const wb = weight(b, idf);
  const [small, large] = wa.size <= wb.size ? [wa, wb] : [wb, wa];
  let dot = 0;
  small.forEach((v, term) => {
    const u = large.get(term);
    if (u) dot += v * u;
  });
  return dot;
}

export interface RankedDoc<T> {
  doc: T;
  score: number;
}

/** Ranking dei documenti rispetto a una query (per ricerca e RAG). */
export function rankByQuery<T>(
  query: string,
  docs: { doc: T; vector: TermVector }[],
): RankedDoc<T>[] {
  const qv = termVector(query);
  const idf = idfMap(docs.map((d) => d.vector).concat([qv]));
  return docs
    .map(({ doc, vector }) => ({ doc, score: cosine(qv, vector, idf) }))
    .filter((r) => r.score > 0.01)
    .sort((x, y) => y.score - x.score);
}

/** Coppie di documenti sopra soglia di similarità (per il grafo). */
export function similarityLinks<T extends { id: string }>(
  docs: { doc: T; vector: TermVector }[],
  threshold = 0.18,
  maxPerNode = 4,
): { source: string; target: string; score: number }[] {
  const idf = idfMap(docs.map((d) => d.vector));
  const links: { source: string; target: string; score: number }[] = [];
  for (let i = 0; i < docs.length; i++) {
    for (let j = i + 1; j < docs.length; j++) {
      const score = cosine(docs[i].vector, docs[j].vector, idf);
      if (score >= threshold) {
        links.push({ source: docs[i].doc.id, target: docs[j].doc.id, score });
      }
    }
  }
  // Limita il grado di ogni nodo tenendo i collegamenti più forti.
  links.sort((a, b) => b.score - a.score);
  const degree = new Map<string, number>();
  return links.filter((l) => {
    const ds = degree.get(l.source) ?? 0;
    const dt = degree.get(l.target) ?? 0;
    if (ds >= maxPerNode || dt >= maxPerNode) return false;
    degree.set(l.source, ds + 1);
    degree.set(l.target, dt + 1);
    return true;
  });
}
