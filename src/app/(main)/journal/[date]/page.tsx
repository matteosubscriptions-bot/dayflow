import Link from "next/link";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dayRange } from "@/lib/dates";

export default async function JournalDayPage({
  params,
}: {
  params: { date: string };
}) {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const day = new Date(params.date);
  const [entries, moods] = await Promise.all([
    prisma.journalEntry.findMany({
      where: { userId, date: dayRange(day) },
      orderBy: { createdAt: "asc" },
    }),
    prisma.mood.findMany({
      where: { userId, date: dayRange(day) },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Link href="/journal" className="btn-ghost text-sm">
        ← Journal
      </Link>
      <h1 className="font-display text-2xl">
        {day.toLocaleDateString("it-IT", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
      </h1>

      {moods.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {moods.map((m) => (
            <span key={m.id} className="flex items-center gap-2 rounded-card bg-mist px-3 py-2 text-sm">
              <span className="text-xl">{m.emoji}</span>
              {m.label} · {m.time}
            </span>
          ))}
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {entries
          .filter((e) => e.voiceRaw)
          .map((e) => (
            <li key={e.id} className="rounded-card bg-mist p-4">
              {e.questionText && (
                <p className="mb-1 text-sm text-ink/50">{e.questionText}</p>
              )}
              <p className="font-display">{e.voiceRaw}</p>
            </li>
          ))}
        {entries.filter((e) => e.voiceRaw).length === 0 && (
          <p className="text-sm text-ink/40">Niente scritto per questo giorno.</p>
        )}
      </ul>
    </div>
  );
}
