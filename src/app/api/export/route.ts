import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/apiAuth";
import { APP_NAME } from "@/lib/brand";

export const dynamic = "force-dynamic";

/** GET /api/export — tutte le note in JSON (senza audio binario). */
export async function GET() {
  const { userId, error } = await requireUserId();
  if (error) return error;

  const [notes, projects, tags] = await Promise.all([
    prisma.note.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      include: {
        tags: { include: { tag: true } },
        project: { select: { name: true } },
        generations: true,
        agentThreads: true,
      },
    }),
    prisma.project.findMany({ where: { userId } }),
    prisma.tag.findMany({ where: { userId } }),
  ]);

  const payload = {
    app: APP_NAME,
    exportedAt: new Date().toISOString(),
    projects: projects.map((p) => ({
      name: p.name,
      description: p.description,
      createdAt: p.createdAt,
    })),
    tags: tags.map((t) => t.name),
    notes: notes.map((n) => ({
      title: n.title,
      status: n.status,
      source: n.source,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
      project: n.project?.name ?? null,
      tags: n.tags.map((t) => t.tag.name),
      transcript: n.transcript,
      contentHtml: n.contentHtml,
      summary: n.summary,
      keyPoints: n.keyPoints,
      todos: n.todos,
      hasAudio: Boolean(n.audioMime),
      audioDuration: n.audioDuration,
      generations: n.generations.map((g) => ({
        kind: g.kind,
        content: g.content,
        createdAt: g.createdAt,
      })),
      agentThreads: n.agentThreads.map((t) => ({
        agent: t.agent,
        messages: t.messages,
      })),
    })),
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${APP_NAME.toLowerCase()}-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
