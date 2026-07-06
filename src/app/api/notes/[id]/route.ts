import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/apiAuth";
import { termVector } from "@/lib/similarity";
import { noteFullText } from "@/lib/noteText";

export const dynamic = "force-dynamic";

async function ownedNote(userId: string, id: string) {
  return prisma.note.findFirst({ where: { id, userId } });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { userId, error } = await requireUserId();
  if (error) return error;

  const note = await prisma.note.findFirst({
    where: { id: params.id, userId },
    include: {
      tags: { include: { tag: true } },
      project: { select: { id: true, name: true } },
      generations: true,
      agentThreads: true,
    },
  });
  if (!note) return NextResponse.json({ error: "Nota non trovata" }, { status: 404 });

  const { audioData, tfVector, ...rest } = note;
  return NextResponse.json({
    ...rest,
    hasAudio: Boolean(note.audioMime),
    tags: note.tags.map((t) => t.tag.name),
  });
}

interface PatchBody {
  title?: string;
  contentHtml?: string;
  status?: "DRAFT" | "READY";
  projectId?: string | null;
  tags?: string[];
  todos?: { text: string; done: boolean }[];
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { userId, error } = await requireUserId();
  if (error) return error;

  const note = await ownedNote(userId, params.id);
  if (!note) return NextResponse.json({ error: "Nota non trovata" }, { status: 404 });

  const body = (await req.json()) as PatchBody;
  const data: Record<string, unknown> = {};
  if (typeof body.title === "string") data.title = body.title.slice(0, 200) || "Senza titolo";
  if (typeof body.contentHtml === "string") data.contentHtml = body.contentHtml;
  if (body.status === "DRAFT" || body.status === "READY") data.status = body.status;
  if ("projectId" in body) data.projectId = body.projectId || null;
  if (Array.isArray(body.todos)) {
    data.todos = body.todos.map((t) => ({
      text: String(t.text),
      done: Boolean(t.done),
    }));
  }

  // Reindicizza il vettore se il testo è cambiato.
  if ("title" in data || "contentHtml" in data) {
    data.tfVector = termVector(
      noteFullText({
        title: (data.title as string) ?? note.title,
        contentHtml: (data.contentHtml as string) ?? note.contentHtml,
        transcript: note.transcript,
      }),
    );
  }

  await prisma.note.update({ where: { id: note.id }, data });

  // Sostituisce l'insieme dei tag, creando quelli nuovi.
  if (Array.isArray(body.tags)) {
    const names = body.tags
      .map((t) => t.toUpperCase().replace(/[^A-Z0-9]/g, ""))
      .filter(Boolean)
      .slice(0, 12);
    await prisma.noteTag.deleteMany({ where: { noteId: note.id } });
    for (const name of names) {
      const tag = await prisma.tag.upsert({
        where: { userId_name: { userId, name } },
        create: { userId, name },
        update: {},
      });
      await prisma.noteTag.create({ data: { noteId: note.id, tagId: tag.id } });
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { userId, error } = await requireUserId();
  if (error) return error;

  const note = await ownedNote(userId, params.id);
  if (!note) return NextResponse.json({ error: "Nota non trovata" }, { status: 404 });

  await prisma.note.delete({ where: { id: note.id } });
  return NextResponse.json({ ok: true });
}
