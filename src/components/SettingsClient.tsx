"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

interface Props {
  email: string;
  initialTheme: "light" | "dark";
  initialScale: number;
}

export function SettingsClient({ email, initialTheme, initialScale }: Props) {
  const router = useRouter();
  const [theme, setTheme] = useState(initialTheme);
  const [scale, setScale] = useState(initialScale);
  const [wiping, setWiping] = useState(false);

  function applyTheme(next: "light" | "dark") {
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("filo-theme", next);
    fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: next }),
    });
  }

  function applyScale(next: number) {
    const clamped = Math.min(150, Math.max(70, next));
    setScale(clamped);
    document.documentElement.style.fontSize = clamped === 100 ? "" : `${clamped}%`;
    localStorage.setItem("filo-text-scale", String(clamped));
    fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ textScale: clamped }),
    });
  }

  async function wipeData() {
    const check = prompt(
      'Questa azione cancella TUTTE le note, i progetti, i tag, gli audio e le conversazioni con gli agenti. Scrivi "ELIMINA" per confermare.',
    );
    if (check !== "ELIMINA") return;
    setWiping(true);
    await fetch("/api/data", { method: "DELETE" });
    setWiping(false);
    router.push("/home");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="label-muted">Impostazioni</p>
        <h1 className="mt-2 font-display italic text-5xl">Il tuo spazio</h1>
        <p className="mt-3 text-muted">Accesso: {email}</p>
      </div>

      {/* Aspetto */}
      <section className="framed">
        <h2 className="label">Aspetto</h2>

        <div className="mt-6">
          <p className="mb-3 text-muted">Tema</p>
          <div className="inline-flex border border-ink/30">
            <button
              onClick={() => applyTheme("light")}
              className={`px-6 py-2.5 text-sm ${theme === "light" ? "bg-ink text-paper" : ""}`}
            >
              Chiaro
            </button>
            <button
              onClick={() => applyTheme("dark")}
              className={`px-6 py-2.5 text-sm ${theme === "dark" ? "bg-ink text-paper" : ""}`}
            >
              Scuro
            </button>
          </div>
        </div>

        <div className="mt-8">
          <p className="mb-3 text-muted">Dimensione testo</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => applyScale(scale - 10)}
              className="border border-ink/30 px-4 py-2 text-lg"
              aria-label="Riduci testo"
            >
              A−
            </button>
            <span className="font-mono tabular-nums">{scale}%</span>
            <button
              onClick={() => applyScale(scale + 10)}
              className="border border-ink/30 px-4 py-2 text-lg"
              aria-label="Ingrandisci testo"
            >
              A+
            </button>
            <button
              onClick={() => applyScale(100)}
              className="label-muted hover:text-ink"
            >
              Reset
            </button>
          </div>
        </div>
      </section>

      {/* I tuoi dati */}
      <section className="framed">
        <h2 className="label">I tuoi dati</h2>

        <div className="mt-6 flex items-center justify-between gap-4">
          <div>
            <p className="font-medium">Esporta le tue note</p>
            <p className="text-sm text-muted">
              Scarica tutto (note, trascrizioni, insights, conversazioni con
              gli agenti) in formato JSON.
            </p>
          </div>
          <a href="/api/export" download className="pill pill-sm shrink-0">
            Esporta
          </a>
        </div>

        <div className="mt-8 border border-red-300 bg-red-50/50 p-5 dark:bg-red-950/20">
          <p className="font-medium text-red-700">Elimina tutti i dati</p>
          <p className="mt-1 text-sm text-muted">
            Cancella definitivamente note, trascrizioni, audio, progetti, tag e
            conversazioni. Azione irreversibile — l&apos;account resta attivo.
          </p>
          <button
            onClick={wipeData}
            disabled={wiping}
            className="mt-4 border border-red-600 px-5 py-2 text-sm uppercase tracking-widest text-red-700 hover:bg-red-600 hover:text-white"
          >
            {wiping ? "Elimino…" : "Elimina i miei dati"}
          </button>
        </div>
      </section>

      {/* Account */}
      <section className="framed">
        <h2 className="label">Account</h2>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="pill pill-sm mt-5"
        >
          Esci
        </button>
      </section>
    </div>
  );
}
