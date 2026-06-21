"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STEPS = ["intro", "name", "vision", "habits"] as const;
type Step = (typeof STEPS)[number];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("intro");
  const [name, setName] = useState("");
  const [vision, setVision] = useState("");
  const [habitsText, setHabitsText] = useState("");
  const [saving, setSaving] = useState(false);

  const next = () => {
    const i = STEPS.indexOf(step);
    if (i < STEPS.length - 1) setStep(STEPS[i + 1]);
  };

  const finish = async () => {
    setSaving(true);
    await fetch("/api/visions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        text: vision,
        habits: habitsText
          .split(/[,\n]/)
          .map((h) => h.trim())
          .filter(Boolean),
      }),
    });
    router.push("/onboarding/goals");
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-content flex-col justify-center px-6 py-10">
      <div className="flex flex-col gap-8 animate-fade-in">
        {step === "intro" && (
          <>
            <h1 className="question-title text-center">
              Benvenuto in DayFlow. Uno spazio per guardarti crescere — un giorno
              alla volta.
            </h1>
            <button type="button" className="btn-primary" onClick={next}>
              Iniziamo
            </button>
          </>
        )}

        {step === "name" && (
          <>
            <h1 className="question-title">Come ti chiami?</h1>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Il tuo nome"
              className="rounded-card border border-ink/10 bg-mist p-4 outline-none focus:border-focus"
            />
            <button type="button" className="btn-primary" onClick={next} disabled={!name.trim()}>
              Continua
            </button>
          </>
        )}

        {step === "vision" && (
          <>
            <h1 className="question-title">
              Dove vorresti essere tra qualche anno? Anche solo una sensazione.
            </h1>
            <textarea
              autoFocus
              value={vision}
              onChange={(e) => setVision(e.target.value)}
              rows={4}
              placeholder="La tua visione…"
              className="resize-none rounded-card border border-ink/10 bg-mist p-4 outline-none focus:border-focus"
            />
            <button type="button" className="btn-primary" onClick={next}>
              Continua
            </button>
          </>
        )}

        {step === "habits" && (
          <>
            <h1 className="question-title">
              Quali abitudini vuoi coltivare? (separale con una virgola)
            </h1>
            <textarea
              autoFocus
              value={habitsText}
              onChange={(e) => setHabitsText(e.target.value)}
              rows={3}
              placeholder="es. meditazione, movimento, lettura"
              className="resize-none rounded-card border border-ink/10 bg-mist p-4 outline-none focus:border-focus"
            />
            <button type="button" className="btn-primary" onClick={finish} disabled={saving}>
              {saving ? "…" : "Continua agli obiettivi"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
