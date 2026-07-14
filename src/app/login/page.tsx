"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function demoLogin() {
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      email: "demo@filo.app",
      password: "filo",
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Errore nel login demo. Riprova.");
      return;
    }
    router.push("/home");
    router.refresh();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      // L'account demo esiste con password "filo": un errore molto comune è
      // confondersi con il dominio dell'email (demo@filo.app).
      setError(
        email.trim().toLowerCase() === "demo@filo.app"
          ? 'Password errata per l\'account demo: è "filo", non "app" (il dominio dell\'email è .app, non la password).'
          : "Credenziali non valide. Se l'email esiste già, ricontrolla la password (maiuscole/minuscole contano).",
      );
      return;
    }
    router.push("/home");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-content flex-col justify-center px-6 py-16">
      <div className="mb-10 flex items-center gap-3">
        <Logo className="h-8 w-8" />
        <span className="label">{APP_NAME}</span>
      </div>

      <h1 className="font-display italic text-5xl leading-tight">
        {APP_TAGLINE}
      </h1>
      <p className="mt-4 max-w-md text-muted">
        Il tuo spazio privato per catturare idee, note e progetti. Al primo
        accesso con una nuova email l&apos;account viene creato automaticamente.
      </p>

      <form onSubmit={onSubmit} className="framed mt-10 flex flex-col gap-5">
        <label className="flex flex-col gap-2">
          <span className="label-muted">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-ink/30 bg-paper px-4 py-3 outline-none focus:border-ink"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="label-muted">Password</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-ink/30 bg-paper px-4 py-3 outline-none focus:border-ink"
          />
        </label>

        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        <button type="submit" disabled={loading} className="pill-solid mt-2">
          {loading ? "Un attimo…" : "Entra"}
        </button>
      </form>

      <button
        onClick={demoLogin}
        disabled={loading}
        className="pill-outline mt-4"
      >
        {loading ? "Un attimo…" : "Demo (entra veloce)"}
      </button>

      <a href="/status" className="label-muted mt-6 hover:text-ink">
        Problemi di accesso? Controlla lo stato del sistema →
      </a>
    </main>
  );
}
