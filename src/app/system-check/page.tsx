import { prisma } from "@/lib/prisma";

async function checkDatabase(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, latencyMs: Date.now() - start };
  } catch (err) {
    return { ok: false, latencyMs: Date.now() - start, error: String(err) };
  }
}

export const dynamic = "force-dynamic";

export default async function SystemCheckPage() {
  const db = await checkDatabase();
  const now = new Date().toISOString();

  return (
    <main className="flex min-h-dvh items-center justify-center bg-paper px-6">
      <div className="w-full max-w-md rounded-card border border-ink/10 bg-white p-8 shadow-sm">
        <h1 className="mb-6 font-display text-2xl text-ink">System Check</h1>

        <div className="flex flex-col gap-4">
          {/* Database */}
          <div className="flex items-center justify-between rounded-xl border border-ink/10 bg-mist px-4 py-3">
            <div className="flex items-center gap-3">
              <span
                className={[
                  "h-3 w-3 rounded-full",
                  db.ok ? "bg-green-500" : "bg-red-500",
                ].join(" ")}
              />
              <span className="text-sm font-medium text-ink">Database</span>
            </div>
            <span className={["text-sm font-semibold", db.ok ? "text-green-600" : "text-red-600"].join(" ")}>
              {db.ok ? `OK — ${db.latencyMs} ms` : "ERRORE"}
            </span>
          </div>

          {db.error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-xs font-mono text-red-700 break-all">{db.error}</p>
            </div>
          )}

          {/* Env vars (presenza, non valori) */}
          {(["DATABASE_URL", "NEXTAUTH_SECRET", "NEXTAUTH_URL"] as const).map((key) => {
            const present = !!process.env[key];
            return (
              <div key={key} className="flex items-center justify-between rounded-xl border border-ink/10 bg-mist px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className={["h-3 w-3 rounded-full", present ? "bg-green-500" : "bg-red-500"].join(" ")} />
                  <span className="font-mono text-xs text-ink">{key}</span>
                </div>
                <span className={["text-sm font-semibold", present ? "text-green-600" : "text-red-600"].join(" ")}>
                  {present ? "impostata" : "mancante"}
                </span>
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-xs text-ink/40">Verifica eseguita: {now}</p>
      </div>
    </main>
  );
}
