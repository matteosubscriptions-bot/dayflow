"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

// Guided goals session entry point for onboarding. Reuses the goal flow.
export default function OnboardingGoalsPage() {
  const router = useRouter();
  return (
    <main className="mx-auto flex min-h-dvh max-w-content flex-col justify-center px-6 py-10">
      <div className="flex flex-col gap-8 animate-fade-in text-center">
        <h1 className="question-title">
          Ottimo. Vuoi definire un primo obiettivo, o preferisci iniziare e farlo
          dopo?
        </h1>
        <div className="flex flex-col gap-3">
          <Link href="/goals/new" className="btn-primary">
            Definisci un obiettivo
          </Link>
          <button
            type="button"
            className="rounded-card border border-ink/10 px-4 py-3 hover:bg-mist"
            onClick={() => {
              router.push("/home");
              router.refresh();
            }}
          >
            Inizia, lo farò dopo
          </button>
        </div>
      </div>
    </main>
  );
}
