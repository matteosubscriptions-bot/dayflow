"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      register: mode === "register" ? "true" : "false",
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Email o password non corretti.");
    } else {
      router.push("/home");
      router.refresh();
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="text-center">
          <h1 className="font-display text-4xl">DayFlow</h1>
          <p className="mt-2 text-ink/50">Uno spazio per guardarti crescere.</p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="rounded-card border border-ink/10 bg-mist p-3 outline-none focus:border-focus"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="rounded-card border border-ink/10 bg-mist p-3 outline-none focus:border-focus"
          />
          {error && <p className="text-sm text-attention">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "…" : mode === "login" ? "Entra" : "Crea account"}
          </button>
        </form>

        <button
          type="button"
          className="btn-ghost text-sm"
          onClick={() => setMode((m) => (m === "login" ? "register" : "login"))}
        >
          {mode === "login"
            ? "Non hai un account? Registrati"
            : "Hai già un account? Entra"}
        </button>

        <p className="text-center text-xs text-ink/30">
          Demo: demo@dayflow.app / dayflow
        </p>
      </div>
    </main>
  );
}
