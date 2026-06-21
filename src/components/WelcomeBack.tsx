"use client";

import { useState } from "react";
import Link from "next/link";

// Welcome-back screen after >= 5 days away (spec §12).
export function WelcomeBack({
  days,
  allowGoalRedefine,
}: {
  days: number;
  allowGoalRedefine: boolean;
}) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-canvas p-6">
      <div className="flex w-full max-w-content flex-col gap-6 text-center">
        <div>
          <p className="meta mb-2">Sei stato via {days} giorni</p>
          <h1 className="question-title">
            Sei stato via per un po&apos;. Nessun problema — succede.
          </h1>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="btn-primary"
          >
            Riparti da oggi
          </button>
          <Link
            href="/checkin/morning?recap=1"
            className="rounded-card border border-ink/10 px-4 py-3 hover:bg-mist"
          >
            Raccontami com&apos;è andata
          </Link>
          <Link
            href="/goals"
            className="rounded-card border border-ink/10 px-4 py-3 hover:bg-mist"
          >
            Rivediamo il piano obiettivi
          </Link>
          {allowGoalRedefine && (
            <Link
              href="/onboarding/goals"
              className="rounded-card border border-ink/10 px-4 py-3 hover:bg-mist"
            >
              Ridefinisci i tuoi obiettivi
            </Link>
          )}
        </div>

        <p className="text-sm text-ink/40">
          Lo streak riparte, ma il cammino resta tuo.
        </p>
      </div>
    </div>
  );
}
