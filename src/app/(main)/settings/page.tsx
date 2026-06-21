"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export default function SettingsPage() {
  const { data: session } = useSession();

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <h1 className="font-display text-3xl">Tu</h1>

      <div className="rounded-card bg-mist p-4">
        <p className="meta">Account</p>
        <p className="mt-1">{session?.user?.email ?? "—"}</p>
      </div>

      <nav className="flex flex-col gap-2">
        <Link href="/settings/habits" className="rounded-card bg-mist p-4 hover:bg-mist/70">
          Gestione abitudini
        </Link>
        <Link href="/settings/checkin-times" className="rounded-card bg-mist p-4 hover:bg-mist/70">
          Orari check-in
        </Link>
        <Link href="/reports" className="rounded-card bg-mist p-4 hover:bg-mist/70">
          Storico report
        </Link>
      </nav>

      <button
        type="button"
        className="rounded-card border border-attention/40 p-4 text-attention hover:bg-attention/10"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        Esci
      </button>
    </div>
  );
}
