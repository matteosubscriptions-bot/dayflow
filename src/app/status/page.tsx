import Link from "next/link";
import { headers } from "next/headers";
import { runSystemChecks, overallStatus, type CheckStatus } from "@/lib/systemStatus";
import { APP_NAME } from "@/lib/brand";
import { Logo } from "@/components/Logo";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<CheckStatus, string> = {
  ok: "OK",
  warn: "Attenzione",
  fail: "Errore",
};

const STATUS_CLASS: Record<CheckStatus, string> = {
  ok: "text-ink",
  warn: "text-amber-700",
  fail: "text-red-700",
};

const OVERALL_TITLE: Record<CheckStatus, string> = {
  ok: "Tutto funziona",
  warn: "Funziona, con qualche avviso",
  fail: "Ci sono problemi da risolvere",
};

/**
 * Pagina diagnostica pubblica (nessun login richiesto): utile proprio
 * quando l'accesso non funziona e serve capire perché.
 */
export default async function StatusPage() {
  const host = headers().get("host");
  const checks = await runSystemChecks(host);
  const overall = overallStatus(checks);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-content flex-col px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <Link href="/login" className="flex items-center gap-2.5">
          <Logo className="h-6 w-6" />
          <span className="label">{APP_NAME}</span>
        </Link>
        <Link href="/login" className="label-muted hover:text-ink">
          ← Accedi
        </Link>
      </div>

      <p className="label-muted">Stato del sistema</p>
      <h1 className="mt-2 font-display italic text-4xl sm:text-5xl">
        Diagnostica
      </h1>
      <p className="mt-3 max-w-md text-muted">
        Controllo di configurazione, database e dati. Questa pagina non
        richiede accesso, proprio per poter capire cosa non va se il login
        non funziona.
      </p>

      <div
        className={`framed mt-8 ${
          overall === "fail"
            ? "border-red-600"
            : overall === "warn"
              ? "border-amber-600"
              : ""
        }`}
      >
        <p className="label">Stato generale</p>
        <p className={`mt-2 font-display italic text-3xl ${STATUS_CLASS[overall]}`}>
          {OVERALL_TITLE[overall]}
        </p>
      </div>

      <ul className="mt-6 divide-y divide-ink/10 border-t border-ink/10">
        {checks.map((c) => (
          <li key={c.id} className="flex items-start justify-between gap-6 py-5">
            <div className="min-w-0">
              <p className="font-medium">{c.label}</p>
              <p className="mt-1 break-words text-sm text-muted">{c.detail}</p>
            </div>
            <span className={`label shrink-0 ${STATUS_CLASS[c.status]}`}>
              {STATUS_LABEL[c.status]}
            </span>
          </li>
        ))}
      </ul>

      <p className="label-muted mt-10">
        Richiesta servita da: {host ?? "sconosciuto"}
      </p>
    </main>
  );
}
