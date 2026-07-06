import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { excerpt } from "@/lib/noteText";
import { shortDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: { tag?: string; project?: string };
}) {
  const userId = (await getCurrentUserId())!;
  const tag = searchParams.tag;
  const projectId = searchParams.project;

  const [notes, tags, projects] = await Promise.all([
    prisma.note.findMany({
      where: {
        userId,
        ...(tag ? { tags: { some: { tag: { name: tag } } } } : {}),
        ...(projectId ? { projectId } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        tags: { include: { tag: true } },
        project: { select: { id: true, name: true } },
      },
    }),
    prisma.tag.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    prisma.project.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <div>
      <p className="label-muted">Libreria</p>
      <h1 className="mt-2 font-display italic text-5xl">Le tue note</h1>

      {/* Filtri per tag e progetto */}
      {(tags.length > 0 || projects.length > 0) && (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Link
            href="/library"
            className={`tag-chip ${!tag && !projectId ? "bg-ink text-paper border-ink" : "hover:border-ink"}`}
          >
            Tutte
          </Link>
          {tags.map((t) => (
            <Link
              key={t.id}
              href={`/library?tag=${encodeURIComponent(t.name)}`}
              className={`tag-chip ${tag === t.name ? "bg-ink !text-paper border-ink" : "hover:border-ink"}`}
            >
              #{t.name}
            </Link>
          ))}
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/library?project=${p.id}`}
              className={`tag-chip ${projectId === p.id ? "bg-ink !text-paper border-ink" : "hover:border-ink"}`}
            >
              ◈ {p.name}
            </Link>
          ))}
        </div>
      )}

      {notes.length === 0 ? (
        <p className="mt-12 text-muted">
          Nessuna nota{tag ? ` con il tag #${tag}` : ""}. Premi Registra per
          catturare il primo pensiero.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-ink/15 border-t border-ink/15">
          {notes.map((n) => (
            <li key={n.id} className="py-7">
              <Link href={`/note/${n.id}`} className="group block">
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="font-display italic text-2xl leading-snug group-hover:underline sm:text-3xl">
                    {n.title}
                  </h2>
                  <span className="label-muted shrink-0">
                    {shortDate(n.createdAt)}
                  </span>
                </div>
                <p className="mt-2 text-muted">{excerpt(n)}</p>
              </Link>
              {(n.tags.length > 0 || n.project) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {n.tags.map((t) => (
                    <span key={t.tagId} className="tag-chip">
                      #{t.tag.name}
                    </span>
                  ))}
                  {n.project ? (
                    <span className="tag-chip">◈ {n.project.name}</span>
                  ) : null}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
