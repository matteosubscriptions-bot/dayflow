// Motore di prioritizzazione e pattern proattivi (spec §3.2, §3.3).
// Tutto locale e deterministico: Eisenhower + Eat-the-Frog come default
// quotidiano; i pattern sono domande, non giudizi.

import type { TaskT, ProjectT, IdeaT, LinkT } from "@/types";

export const qScore = (t: TaskT) => (t.importance || 0) * 2 + (t.urgency || 0);

export const eisenhowerSort = (ts: TaskT[]) =>
  [...ts].sort((a, b) => qScore(b) - qScore(a) || (b.urgency || 0) - (a.urgency || 0));

// La "rana": il task più importante (e più rimandato) da fare per primo.
export function pickFrog(ts: TaskT[]): TaskT | null {
  const open = ts.filter((t) => t.status === "todo");
  if (!open.length) return null;
  return [...open].sort(
    (a, b) =>
      (b.importance || 0) * 2 + (b.deferredCount || 0) -
        ((a.importance || 0) * 2 + (a.deferredCount || 0)) ||
      (b.urgency || 0) - (a.urgency || 0)
  )[0];
}

// "Una cosa alla volta": dopo la rana, al massimo altre tre.
export const topThree = (ts: TaskT[], frogId?: string | null) =>
  eisenhowerSort(ts.filter((t) => t.status === "todo" && t.id !== frogId)).slice(0, 3);

export const stalledProjects = (ps: ProjectT[], now: number, days = 7) =>
  ps.filter(
    (p) =>
      p.status === "active" &&
      p.lastProgressAt &&
      now - new Date(p.lastProgressAt).getTime() > days * 86400000
  );

export const overDeferred = (ts: TaskT[], n = 3) =>
  ts.filter((t) => t.status === "todo" && (t.deferredCount || 0) >= n);

export const matureIdeasNotTasks = (ideas: IdeaT[], links: LinkT[]) => {
  const became = new Set(
    links.filter((l) => l.relation === "became_task").map((l) => l.fromId)
  );
  return ideas.filter((i) => i.maturity === "mature" && !became.has(i.id));
};

// ── Vicinanza per tema (senza embeddings: overlap di token) ──
// Sufficiente per un utente singolo con centinaia di idee; la ricerca
// semantica vera su embeddings è un'estensione di fase 4.
const STOP = new Set(
  "il lo la i gli le un una uno di a da in con su per tra fra e o ma che non si mi ti ci vi del della dei delle al alla ai alle è sono ho hai ha più come anche se questo questa quello quella cosa".split(" ")
);

export const tokenize = (t: string) =>
  (t || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));

export function similarity(a: string, b: string): number {
  const ta = new Set(tokenize(a));
  const tb = new Set(tokenize(b));
  if (!ta.size || !tb.size) return 0;
  let common = 0;
  ta.forEach((w) => tb.has(w) && common++);
  return common / Math.min(ta.size, tb.size);
}

// Cluster per tema: raggruppa le idee che condividono il campo theme
// o con forte overlap lessicale nel titolo.
export function clusterByTheme(ideas: IdeaT[]) {
  const groups = new Map<string, IdeaT[]>();
  for (const i of ideas) {
    const key = (i.theme || "").trim().toLowerCase() || "—";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(i);
  }
  return [...groups.entries()]
    .filter(([k, v]) => k !== "—" && v.length >= 2)
    .sort((a, b) => b[1].length - a[1].length);
}
