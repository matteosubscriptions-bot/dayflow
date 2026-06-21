"use client";

import Link from "next/link";

export interface GoalNode {
  id: string;
  title: string;
  horizon: string;
  progress: number;
  status: string;
  parentId: string | null;
}

const HORIZON_ORDER = ["12m", "3m", "1m", "week"];
const HORIZON_LABEL: Record<string, string> = {
  "12m": "12 mesi",
  "3m": "3 mesi",
  "1m": "1 mese",
  week: "Settimana",
};

/**
 * Vertical goal tree: Vision -> 12m -> 3m -> 1m -> actions (spec §8).
 */
export function GoalTree({
  visionText,
  goals,
  highlightLevel,
}: {
  visionText?: string;
  goals: GoalNode[];
  highlightLevel?: string;
}) {
  const byHorizon = HORIZON_ORDER.map((h) => ({
    horizon: h,
    goals: goals.filter((g) => g.horizon === h && g.status !== "dropped"),
  })).filter((g) => g.goals.length);

  return (
    <div className="flex flex-col gap-4">
      {visionText && (
        <div className="rounded-card bg-low/15 p-4">
          <p className="meta mb-1">Visione</p>
          <p className="font-display text-lg">{visionText}</p>
        </div>
      )}

      {byHorizon.map(({ horizon, goals: levelGoals }, i) => (
        <div key={horizon} className="relative flex flex-col gap-2 pl-4">
          {i > 0 && <span className="absolute left-0 top-[-12px] h-3 w-px bg-ink/15" />}
          <p className="meta">{HORIZON_LABEL[horizon] ?? horizon}</p>
          {levelGoals.map((g) => (
            <Link
              key={g.id}
              href={`/goals/${g.id}`}
              className={`flex items-center justify-between rounded-card p-4 transition-colors ${
                highlightLevel === horizon ? "bg-focus/15" : "bg-mist hover:bg-mist/70"
              }`}
            >
              <span>{g.title}</span>
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-16 overflow-hidden rounded-full bg-ink/10">
                  <span
                    className="block h-full rounded-full bg-achieved"
                    style={{ width: `${g.progress}%` }}
                  />
                </span>
                <span className="meta">{g.progress}%</span>
              </span>
            </Link>
          ))}
        </div>
      ))}

      {byHorizon.length === 0 && (
        <p className="text-sm text-ink/40">
          Nessun obiettivo ancora. Inizia da una visione.
        </p>
      )}
    </div>
  );
}
