import { prisma } from "@/lib/prisma";

export type CheckStatus = "ok" | "warn" | "fail";

export interface CheckResult {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
}

/** Mostra solo host/porta/db della connection string, mai le credenziali. */
function maskDbUrl(raw?: string): string {
  if (!raw) return "non impostata";
  try {
    const u = new URL(raw);
    return `${u.protocol}//${u.hostname}:${u.port || "5432"}${u.pathname}`;
  } catch {
    return "formato non valido";
  }
}

/**
 * Batteria di controlli diagnostici: env, connessione DB, schema, dati.
 * Pensata per essere leggibile senza essere autenticati (utile proprio
 * quando il login non funziona).
 */
export async function runSystemChecks(requestHost: string | null): Promise<CheckResult[]> {
  const checks: CheckResult[] = [];

  // ── Variabili d'ambiente critiche ──────────────────────────────
  const dbUrl = process.env.DATABASE_URL;
  checks.push({
    id: "env-database-url",
    label: "DATABASE_URL",
    status: dbUrl ? "ok" : "fail",
    detail: dbUrl ? maskDbUrl(dbUrl) : "non impostata — l'app non può leggere/scrivere nulla",
  });

  const secret = process.env.NEXTAUTH_SECRET;
  checks.push({
    id: "env-nextauth-secret",
    label: "NEXTAUTH_SECRET",
    status: !secret
      ? "fail"
      : secret === "change-me-with-openssl-rand-base64-32"
        ? "warn"
        : "ok",
    detail: !secret
      ? "non impostata — il login non può funzionare"
      : secret === "change-me-with-openssl-rand-base64-32"
        ? "impostata al valore di esempio: generane una vera con `openssl rand -base64 32`"
        : "impostata",
  });

  const nextAuthUrl = process.env.NEXTAUTH_URL;
  checks.push({
    id: "env-nextauth-url",
    label: "NEXTAUTH_URL",
    status: nextAuthUrl ? "ok" : "fail",
    detail: nextAuthUrl ?? "non impostata — il login può fallire silenziosamente",
  });

  if (nextAuthUrl && requestHost) {
    try {
      const configuredHost = new URL(nextAuthUrl).host;
      const match = configuredHost === requestHost;
      checks.push({
        id: "nextauth-host-match",
        label: "NEXTAUTH_URL combacia col dominio richiesto",
        status: match ? "ok" : "fail",
        detail: match
          ? configuredHost
          : `Configurato "${configuredHost}", ma questa pagina è servita da "${requestHost}". Se non coincidono, il login fallisce silenziosamente: aggiorna NEXTAUTH_URL con il dominio reale del deploy.`,
      });
    } catch {
      checks.push({
        id: "nextauth-host-match",
        label: "NEXTAUTH_URL combacia col dominio richiesto",
        status: "warn",
        detail: "NEXTAUTH_URL non è un URL valido",
      });
    }
  }

  // ── Chiavi AI opzionali ─────────────────────────────────────────
  for (const [key, label] of [
    ["ANTHROPIC_API_KEY", "ANTHROPIC_API_KEY (insights, agenti, Crea, Chiedi al cervello)"],
    ["OPENAI_API_KEY", "OPENAI_API_KEY (trascrizione upload/offline)"],
    ["GROQ_API_KEY", "GROQ_API_KEY (trascrizione upload/offline)"],
  ] as const) {
    const val = process.env[key];
    checks.push({
      id: `env-${key}`,
      label,
      status: val ? "ok" : "warn",
      detail: val ? "impostata" : "non impostata — verrà usato il fallback locale",
    });
  }

  // ── Connessione al database ─────────────────────────────────────
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.push({
      id: "db-connect",
      label: "Connessione al database",
      status: "ok",
      detail: `Raggiungibile (${Date.now() - start} ms)`,
    });
  } catch (e) {
    checks.push({
      id: "db-connect",
      label: "Connessione al database",
      status: "fail",
      detail: e instanceof Error ? e.message.slice(0, 400) : "Errore sconosciuto",
    });
    // Senza connessione i controlli successivi non hanno senso.
    return checks;
  }

  // ── Tabelle applicative (migration applicate) ───────────────────
  try {
    const rows = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
    `;
    const present = new Set(rows.map((r) => r.table_name));
    const expected = ["User", "Project", "Note", "Tag", "NoteTag", "Generation", "AgentThread"];
    const missing = expected.filter((t) => !present.has(t));
    checks.push({
      id: "db-tables",
      label: "Tabelle applicative",
      status: missing.length === 0 ? "ok" : "fail",
      detail:
        missing.length === 0
          ? `Tutte presenti (${expected.length}/${expected.length})`
          : `Mancanti: ${missing.join(", ")} — esegui "npx prisma migrate deploy" puntando a questo database`,
    });
  } catch (e) {
    checks.push({
      id: "db-tables",
      label: "Tabelle applicative",
      status: "fail",
      detail: e instanceof Error ? e.message.slice(0, 400) : "Errore sconosciuto",
    });
  }

  // ── Account e dati ───────────────────────────────────────────────
  try {
    const [userCount, noteCount, demo] = await Promise.all([
      prisma.user.count(),
      prisma.note.count(),
      prisma.user.findUnique({ where: { email: "demo@filo.app" }, select: { id: true } }),
    ]);
    checks.push({
      id: "users",
      label: "Account e note",
      status: userCount > 0 ? "ok" : "warn",
      detail:
        userCount > 0
          ? `${userCount} account, ${noteCount} note. Al primo accesso con un'email nuova l'account si crea automaticamente con quella password.`
          : "Nessun account ancora: entra dalla pagina di login con qualunque email/password per crearne uno.",
    });
    checks.push({
      id: "demo-account",
      label: "Account demo (demo@filo.app)",
      status: demo ? "ok" : "warn",
      detail: demo
        ? "Presente. Password: filo (minuscolo). Se hai dimenticato di averla cambiata, riprova con questa."
        : "Non presente su questo database — esegui `npm run db:seed` oppure crea un account con una email tua dalla pagina di login.",
    });
  } catch (e) {
    checks.push({
      id: "users",
      label: "Account e note",
      status: "fail",
      detail: e instanceof Error ? e.message.slice(0, 400) : "Errore sconosciuto",
    });
  }

  return checks;
}

export function overallStatus(checks: CheckResult[]): CheckStatus {
  if (checks.some((c) => c.status === "fail")) return "fail";
  if (checks.some((c) => c.status === "warn")) return "warn";
  return "ok";
}
