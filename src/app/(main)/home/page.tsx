import Link from "next/link";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dayRange } from "@/lib/dates";

const SLOT_LABEL: Record<string, string> = {
  morning: "Check-in mattina",
  midday: "Check-in metà giornata",
  evening: "Check-in sera",
};

function currentSlot(): "morning" | "midday" | "evening" {
  const h = new Date().getHours();
  if (h < 11) return "morning";
  if (h < 17) return "midday";
  return "evening";
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Buongiorno";
  if (h < 18) return "Buon pomeriggio";
  return "Buonasera";
}

export default async function HomePage() {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const today = new Date();

  const [user, todayCheckIns, lastMood, openTasks, activeGoals] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.checkIn.findMany({ where: { userId, date: dayRange(today) } }),
    prisma.mood.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.task.findMany({
      where: { userId, status: "todo" },
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
      take: 3,
    }),
    prisma.goal.count({ where: { userId, status: "active" } }),
  ]);

  const slot = currentSlot();
  const doneSlots = new Set(
    todayCheckIns.filter((c) => c.completedAt).map((c) => c.type),
  );
  const slotDone = doneSlots.has(slot);

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <header>
        <p className="meta">
          {today.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <h1 className="mt-1 font-display text-3xl">
          {greeting()}{user?.name ? `, ${user.name}` : ""}.
        </h1>
      </header>

      {/* Primary check-in CTA */}
      <section
        className={`rounded-card p-6 ${slotDone ? "bg-achieved/15" : "bg-focus/10"}`}
      >
        {slotDone ? (
          <div className="flex flex-col gap-2">
            <p className="question-title">Check-in di oggi: fatto.</p>
            <p className="text-ink/60">Hai dato un nome a questo momento.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="question-title">{SLOT_LABEL[slot]}</p>
            <div className="flex flex-wrap gap-3">
              <Link href={`/checkin/${slot}`} className="btn-primary">
                Inizia
              </Link>
              <Link
                href={`/checkin/quick`}
                className="rounded-card border border-ink/10 px-4 py-3 text-sm hover:bg-mist"
              >
                Solo 60 secondi
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Mood snapshot */}
      {lastMood && (
        <section className="flex items-center gap-4 rounded-card bg-mist p-4">
          <span className="text-3xl">{lastMood.emoji}</span>
          <div>
            <p className="text-sm">{lastMood.label}</p>
            <p className="meta">
              Energia {lastMood.energy}/10 · {lastMood.time}
            </p>
          </div>
        </section>
      )}

      {/* Top tasks */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="meta">Oggi conta</h2>
          <Link href="/tasks" className="btn-ghost text-sm">
            Tutti i task
          </Link>
        </div>
        {openTasks.length ? (
          <ul className="flex flex-col gap-2">
            {openTasks.map((t) => (
              <li key={t.id} className="rounded-card bg-mist p-3 text-sm">
                {t.title}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink/40">Nessun task. Lo spazio è anche silenzio.</p>
        )}
      </section>

      {/* Quick links */}
      <section className="grid grid-cols-2 gap-3">
        <Link href="/goals" className="rounded-card bg-mist p-4 hover:bg-mist/70">
          <p className="font-display text-lg">Obiettivi</p>
          <p className="meta mt-1">{activeGoals} attivi</p>
        </Link>
        <Link href="/review/weekly" className="rounded-card bg-mist p-4 hover:bg-mist/70">
          <p className="font-display text-lg">Review</p>
          <p className="meta mt-1">Settimana</p>
        </Link>
        <Link href="/routines" className="rounded-card bg-mist p-4 hover:bg-mist/70">
          <p className="font-display text-lg">Routine</p>
          <p className="meta mt-1">Abitudini</p>
        </Link>
        <Link href="/ideas" className="rounded-card bg-mist p-4 hover:bg-mist/70">
          <p className="font-display text-lg">Idee</p>
          <p className="meta mt-1">Cattura</p>
        </Link>
      </section>
    </div>
  );
}
