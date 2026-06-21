import Link from "next/link";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TYPE_LABEL: Record<string, string> = {
  daily: "Giornaliero",
  weekly: "Settimanale",
  monthly: "Mensile",
};

export default async function ReportsPage() {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const reports = await prisma.report.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Report</h1>
        <div className="flex gap-2">
          <Link href="/review/weekly" className="rounded-card border border-ink/10 px-3 py-1.5 text-sm hover:bg-mist">
            + Settimana
          </Link>
          <Link href="/review/monthly" className="rounded-card border border-ink/10 px-3 py-1.5 text-sm hover:bg-mist">
            + Mese
          </Link>
        </div>
      </header>

      {reports.length === 0 ? (
        <p className="text-sm text-ink/40">
          Nessun report ancora. Genera una review per iniziare.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {reports.map((r) => (
            <li key={r.id}>
              <Link
                href={`/reports/${r.id}`}
                className="flex items-center justify-between rounded-card bg-mist p-4 hover:bg-mist/70"
              >
                <div>
                  <p className="font-display">{TYPE_LABEL[r.type] ?? r.type}</p>
                  <p className="meta mt-1">
                    {r.periodStart.toLocaleDateString("it-IT")} –{" "}
                    {r.periodEnd.toLocaleDateString("it-IT")}
                  </p>
                </div>
                <span className="text-ink/30">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
