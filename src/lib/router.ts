// Router locale della cattura: nessuna rete, nessun LLM.
// Classifica il grezzo in task / idea / specchio; se ambiguo lo dice,
// e la scelta resta all'utente (spec §A.2: mai decidere in silenzio).
// Il rilevamento del disagio è anch'esso locale: quei contenuti non
// lasciano mai il dispositivo (spec §4.2).

const TASK_PAT = [
  /\bdevo\b/, /\bda fare\b/,
  /\bentro (luned|marted|mercoled|gioved|venerd|sabato|domenica|il|domani|oggi|fine)/,
  /\bscadenza\b/, /\bchiamare\b/, /\bprenotare\b/, /\bcomprare\b/, /\binviare\b/,
  /\bfissare\b/, /\bcompletare\b/, /\bfinire\b/, /\bconsegnare\b/, /\bpagare\b/,
  /\bappuntamento\b/, /\btask\b/, /\bricordami\b/, /\bpromemoria\b/,
];
const IDEA_PAT = [
  /\bidea\b/, /\be se\b/, /\bpotrei (creare|costruire|scrivere|provare)\b/,
  /\bmi è venuto in mente\b/, /\bconcetto\b/, /\bimmagino\b/, /\bspunt[oi]\b/,
  /\bsarebbe (bello|interessante)\b/, /\bprogetto per\b/, /\bintuizione\b/,
];
const SPECCHIO_PAT = [
  /\bmi sento\b/, /\bmi accorgo\b/,
  /\bsono (stanc|felic|trist|ansios|agitat|seren|nervos|svuotat)/,
  /\bgratitudin|\bgrato\b|\bgrata\b/, /\bumore\b/, /\benergia\b/, /\bansia\b/,
  /\bemozion/, /\boggi è stata\b/, /\bdentro di me\b/, /\briflettev/,
  /\bpaura\b/, /\brabbia\b/, /\bmi pesa\b/,
];

const score = (t: string, ps: RegExp[]) =>
  ps.reduce((n, re) => n + (re.test(t.toLowerCase()) ? 1 : 0), 0);

export type RouteResult = { domain: string | null; ambiguous: boolean };

export function routeCapture(text: string): RouteResult {
  const s = {
    task: score(text, TASK_PAT),
    idea: score(text, IDEA_PAT),
    specchio: score(text, SPECCHIO_PAT),
  };
  const e = Object.entries(s).sort((a, b) => b[1] - a[1]);
  if (e[0][1] === 0 || e[0][1] === e[1][1]) return { domain: null, ambiguous: true };
  const map: Record<string, string> = {
    task: "officina-task",
    idea: "officina-idea",
    specchio: "specchio",
  };
  return { domain: map[e[0][0]], ambiguous: false };
}

// Commutatore normale/disagio — client-side, PRIMA di qualsiasi rete.
const DISTRESS_PAT = [
  /farmi del male/, /farla finita/, /non voglio più vivere/, /vorrei morire/,
  /voglio morire/, /uccidermi/, /ammazzarmi/, /autolesion/, /togliermi la vita/,
  /sparire per sempre/, /non ce la faccio più/, /nessuna via d'uscita/,
  /senza via d'uscita/, /non ha più senso (niente|nulla|vivere)/,
  /disperat[oa]\b/, /mi odio/, /faccio schifo a tutti/,
  /meglio se non ci fossi/, /se non esistessi/,
];

export const detectDistress = (t: string) =>
  DISTRESS_PAT.some((re) => re.test((t || "").toLowerCase()));

export const MSG_DISAGIO =
  "Mi fermo qui con le domande — non è il momento di scavare, è il momento di fare spazio. " +
  "Quello che senti merita una presenza vera, non un'app: parlane con una persona di cui ti fidi, " +
  "o con un professionista. Io resto qui, senza analizzare niente. " +
  "Questo che hai scritto non lascia il tuo dispositivo.";
