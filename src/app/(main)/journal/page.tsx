import Link from "next/link";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TYPE_LABEL: Record<string, string> = {
  morning: "Mattina",
  midday: "Giornata",
  evening: "Sera",
  free: "Pensiero",
  weekly: "Settimana",
  monthly: "Mese",
};

export default async function JournalPage() {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const entries = await prisma.journalEntry.findMany({
    where: { userId, voiceRaw: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 80,
  });

  // Group by day.
  const groups = new Map<string, typeof entries>();
  for (const e of entries) {
    const key = e.date.toISOString().slice(0, 10);
    const arr = groups.get(key) ?? [];
    arr.push(e);
    groups.set(key, arr);
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <h1 className="font-display text-3xl">Journal</h1>

      {groups.size === 0 ? (
        <p className="text-sm text-ink/40">
          Ancora niente scritto. Ogni check-in lascia traccia qui.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {Array.from(groups.entries()).map(([day, items]) => (
            <section key={day}>
              <Link href={`/journal/${day}`} className="meta hover:text-focus">
                {new Date(day).toLocaleDateString("it-IT", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </Link>
              <ul className="mt-2 flex flex-col gap-2">
                {items.map((e) => (
                  <li key={e.id} className="rounded-card bg-mist p-4">
                    {e.questionText && (
                      <p className="mb-1 text-sm text-ink/50">{e.questionText}</p>
                    )}
                    <p className="font-display">{e.voiceRaw}</p>
                    <p className="meta mt-2">{TYPE_LABEL[e.type] ?? e.type}</p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
