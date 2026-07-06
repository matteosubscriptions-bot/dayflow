import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { excerpt } from "@/lib/noteText";
import { fullDate } from "@/lib/dates";
import { CaptureHero } from "@/components/CaptureHero";
import { SearchBar } from "@/components/SearchBar";
import { AskBrain } from "@/components/AskBrain";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const userId = (await getCurrentUserId())!;
  const [notes, total] = await Promise.all([
    prisma.note.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: {
        id: true,
        title: true,
        contentHtml: true,
        transcript: true,
        createdAt: true,
      },
    }),
    prisma.note.count({ where: { userId } }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      {/* Cattura un pensiero */}
      <CaptureHero />

      {/* Ricerca semantica */}
      <section className="framed">
        <SearchBar />
      </section>

      {/* Chiedi al tuo cervello */}
      <section className="border border-line bg-teal p-6 text-teal-ink sm:p-8">
        <AskBrain />
      </section>

      {/* Note recenti */}
      <section className="framed">
        <div className="mb-6 flex items-baseline justify-between gap-4">
          <h2 className="label">Note recenti</h2>
          <Link
            href="/library"
            className="font-mono text-xs uppercase tracking-[0.2em] text-muted hover:text-ink"
          >
            {total} note · Vedi tutte →
          </Link>
        </div>

        {notes.length === 0 ? (
          <p className="text-muted">
            Nessuna nota ancora. Registra il tuo primo pensiero.
          </p>
        ) : (
          <ul className="flex flex-col gap-6">
            {notes.map((n) => (
              <li key={n.id} className="border-l border-ink/20 pl-4">
                <p className="label-muted mb-2">{fullDate(n.createdAt)}</p>
                <Link href={`/note/${n.id}`} className="group">
                  <h3 className="font-display italic text-2xl leading-snug group-hover:underline">
                    {n.title}
                  </h3>
                  <p className="mt-1 text-muted">{excerpt(n, 110)}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
