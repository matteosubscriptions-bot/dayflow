"use client";

import { useEffect, useState } from "react";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { ReportDashboard } from "@/components/ReportDashboard";
import type { ReportContent } from "@/lib/reports";

export function ReviewClient({ type }: { type: "weekly" | "monthly" }) {
  const [content, setContent] = useState<ReportContent | null>(null);
  const [narrative, setNarrative] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const now = new Date();
      const periodStart =
        type === "weekly"
          ? startOfWeek(now, { weekStartsOn: 1 })
          : startOfMonth(now);
      const periodEnd =
        type === "weekly" ? endOfWeek(now, { weekStartsOn: 1 }) : endOfMonth(now);

      try {
        const genRes = await fetch("/api/reports/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type,
            periodStart: periodStart.toISOString(),
            periodEnd: periodEnd.toISOString(),
          }),
        });
        const { reportId } = await genRes.json();
        const res = await fetch(`/api/reports/${reportId}`);
        const data = await res.json();
        if (cancelled) return;
        setContent(data.report?.content ?? null);
        setNarrative(data.report?.narrative ?? null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [type]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <h1 className="font-display text-3xl">
        Review {type === "weekly" ? "settimanale" : "mensile"}
      </h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-2 w-2 animate-pulse rounded-full bg-focus"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      ) : (
        <>
          {narrative ? (
            <div className="rounded-card bg-low/10 p-5">
              <p className="meta mb-2">Lo specchio</p>
              <p className="whitespace-pre-line font-display leading-relaxed">{narrative}</p>
            </div>
          ) : (
            <p className="text-sm text-ink/40">
              Narrativa disponibile quando l&apos;AI è raggiungibile. Qui sotto i dati.
            </p>
          )}
          {content && <ReportDashboard content={content} />}
        </>
      )}
    </div>
  );
}
