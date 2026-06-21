"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckInFlow } from "@/components/CheckInFlow";
import { getStepsForType, QUICK_STEPS } from "@/lib/checkinSteps";
import type { CheckInStep, LiveCheckInType } from "@/types";

type RouteType = LiveCheckInType | "quick";

const TITLES: Record<RouteType, string> = {
  morning: "Mattina",
  midday: "Metà giornata",
  evening: "Sera",
  quick: "Check-in rapido",
};

export default function CheckInPage() {
  const params = useParams();
  const router = useRouter();
  const routeType = (params.type as RouteType) ?? "morning";
  const isQuick = routeType === "quick";
  const apiType: LiveCheckInType = isQuick ? "evening" : (routeType as LiveCheckInType);

  const [checkInId, setCheckInId] = useState<string | null>(null);
  const [steps, setSteps] = useState<CheckInStep[]>([]);
  const [habits, setHabits] = useState<{ id: string; name: string }[]>([]);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const baseSteps = useMemo(
    () => (isQuick ? QUICK_STEPS : getStepsForType(apiType)),
    [isQuick, apiType],
  );

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const [startRes, habitsRes] = await Promise.all([
          fetch("/api/checkin/start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: apiType, date: new Date().toISOString() }),
          }),
          fetch("/api/habits"),
        ]);
        const start = await startRes.json();
        const habitsData = await habitsRes.json().catch(() => ({ habits: [] }));
        if (cancelled) return;

        const dynamicSteps: CheckInStep[] = isQuick
          ? []
          : (start.dynamicQuestions ?? []).map((q: string, i: number) => ({
              id: `dyn-${i}`,
              questionKey: `dynamic_${i}`,
              questionText: q,
              isDynamic: true,
              inputType: "voice" as const,
              isSkippable: true,
            }));

        // Insert dynamic questions before the last reflective step.
        const composed = isQuick
          ? baseSteps
          : [...baseSteps.slice(0, -1), ...dynamicSteps, baseSteps[baseSteps.length - 1]];

        setCheckInId(start.checkInId);
        setSteps(composed);
        setHabits(habitsData.habits ?? []);
      } catch {
        if (!cancelled) setError(true);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [apiType, isQuick, baseSteps]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-content flex-col px-6 py-6 md:px-8">
      <header className="mb-8 flex items-center justify-between">
        <span className="meta">{TITLES[routeType]}</span>
        <Link href="/home" className="btn-ghost text-sm" aria-label="Chiudi">
          Chiudi
        </Link>
      </header>

      <div className="flex flex-1 flex-col justify-center">
        {error ? (
          <div className="text-center">
            <p className="question-title mb-4">Qualcosa non ha funzionato.</p>
            <Link href="/home" className="btn-primary">
              Torna alla home
            </Link>
          </div>
        ) : done ? (
          <div className="flex flex-col items-center gap-8 text-center animate-fade-in">
            <p className="question-title max-w-md">{done}</p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                router.push("/home");
                router.refresh();
              }}
            >
              Torna alla home
            </button>
          </div>
        ) : checkInId && steps.length ? (
          <CheckInFlow
            type={apiType}
            checkInId={checkInId}
            steps={steps}
            habits={habits}
            onComplete={(msg) => setDone(msg)}
          />
        ) : (
          <div className="flex justify-center">
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
        )}
      </div>
    </main>
  );
}
