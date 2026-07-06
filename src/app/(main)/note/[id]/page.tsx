import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { NoteDetail } from "@/components/NoteDetail";

export const dynamic = "force-dynamic";

export default async function NotePage({ params }: { params: { id: string } }) {
  const userId = (await getCurrentUserId())!;
  const note = await prisma.note.findFirst({
    where: { id: params.id, userId },
    include: {
      tags: { include: { tag: true } },
      generations: true,
    },
  });
  if (!note) notFound();

  const [allTags, projects] = await Promise.all([
    prisma.tag.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    prisma.project.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <NoteDetail
      note={{
        id: note.id,
        title: note.title,
        contentHtml: note.contentHtml,
        transcript: note.transcript,
        status: note.status,
        source: note.source,
        hasAudio: Boolean(note.audioMime),
        audioDuration: note.audioDuration,
        createdAt: note.createdAt.toISOString(),
        projectId: note.projectId,
        summary: note.summary,
        keyPoints: (note.keyPoints as string[] | null) ?? null,
        todos: (note.todos as { text: string; done: boolean }[] | null) ?? null,
        tags: note.tags.map((t) => t.tag.name),
        generations: note.generations.map((g) => ({
          kind: g.kind,
          content: g.content,
        })),
      }}
      allTags={allTags.map((t) => t.name)}
      projects={projects.map((p) => ({ id: p.id, name: p.name }))}
    />
  );
}
