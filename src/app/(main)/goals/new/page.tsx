"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { GoalHierarchy } from "@/types";

export default function NewGoalPage() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "preview">("form");
  const [title, setTitle] = useState("");
  const [area, setArea] = useState("");
  const [horizon, setHorizon] = useState("12m");
  const [whyDeep, setWhyDeep] = useState("");
  const [plan, setPlan] = useState<GoalHierarchy | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/reverse-engineering", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalTitle: title, area, horizon, whyDeep }),
      });
      const data = (await res.json()) as GoalHierarchy;
      setPlan(data);
      setStep("preview");
    } catch {
      setPlan({ milestones: [], monthlyFocus: [], weeklyActions: [], tomorrowTasks: [] });
      setStep("preview");
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    setLoading(true);
    try {
      await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          area,
          horizon,
          whyDeep,
          hierarchy: plan ?? undefined,
        }),
      });
      router.push("/goals");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  if (step === "preview" && plan) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in">
        <h1 className="font-display text-2xl">Il piano per: {title}</h1>
        <p className="text-sm text-ink/50">
          Reverse engineering dell&apos;obiettivo. Puoi salvarlo così com&apos;è e
          affinarlo dopo.
        </p>

        <Section title="Milestone trimestrali" items={plan.milestones.map((m) => m.title)} />
        <Section title="Focus del mese" items={plan.monthlyFocus} />
        <Section title="Azioni della settimana" items={plan.weeklyActions} />
        <Section title="Per domani" items={plan.tomorrowTasks} />

        <div className="flex gap-3">
          <button type="button" className="btn-ghost" onClick={() => setStep("form")}>
            Indietro
          </button>
          <button type="button" className="btn-primary flex-1" onClick={save} disabled={loading}>
            {loading ? "Salvo…" : "Salva obiettivo"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <h1 className="font-display text-2xl">Nuovo obiettivo</h1>

      <Field label="Cosa vuoi raggiungere?">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="es. Scrivere un libro"
          className="w-full rounded-card border border-ink/10 bg-mist p-3 outline-none focus:border-focus"
        />
      </Field>

      <Field label="Area">
        <input
          value={area}
          onChange={(e) => setArea(e.target.value)}
          placeholder="es. Creatività, Salute, Carriera"
          className="w-full rounded-card border border-ink/10 bg-mist p-3 outline-none focus:border-focus"
        />
      </Field>

      <Field label="Orizzonte">
        <select
          value={horizon}
          onChange={(e) => setHorizon(e.target.value)}
          className="w-full rounded-card border border-ink/10 bg-mist p-3 outline-none focus:border-focus"
        >
          <option value="12m">12 mesi</option>
          <option value="3m">3 mesi</option>
          <option value="1m">1 mese</option>
        </select>
      </Field>

      <Field label="Perché profondo? (resta privato, anonimizzato per l'AI)">
        <textarea
          value={whyDeep}
          onChange={(e) => setWhyDeep(e.target.value)}
          rows={3}
          placeholder="Cosa rende questo obiettivo davvero tuo?"
          className="w-full resize-none rounded-card border border-ink/10 bg-mist p-3 outline-none focus:border-focus"
        />
      </Field>

      <button
        type="button"
        className="btn-primary"
        onClick={generate}
        disabled={!title.trim() || loading}
      >
        {loading ? "Sto scomponendo…" : "Scomponi in piano"}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="meta">{label}</span>
      {children}
    </label>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="rounded-card bg-mist p-4">
      <p className="meta mb-2">{title}</p>
      <ul className="flex flex-col gap-1.5">
        {items.map((it, i) => (
          <li key={i} className="text-sm">
            • {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
