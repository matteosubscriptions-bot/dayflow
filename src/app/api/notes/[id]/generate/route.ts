import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/apiAuth";
import { noteFullText } from "@/lib/noteText";
import { generateContent, type GenerationKind } from "@/lib/ai/generate";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const KINDS: GenerationKind[] = ["SOCIAL", "EMAIL", "ARTICLE", "SPEECH"];

/** POST /api/notes/:id/generate { kind } — crea/rigenera un contenuto. */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { userId, error } = await requireUserId();
  if (error) return error;

  const note = await prisma.note.findFirst({ where: { id: params.id, userId } });
  if (!note) return NextResponse.json({ error: "Nota non trovata" }, { status: 404 });

  const { kind } = (await req.json()) as { kind: GenerationKind };
  if (!KINDS.includes(kind)) {
    return NextResponse.json({ error: "kind non valido" }, { status: 400 });
  }

  const text = noteFullText(note);
  if (!text.trim()) {
    return NextResponse.json({ error: "La nota è vuota" }, { status: 400 });
  }

  const { content, ai } = await generateContent(kind, text);

  const generation = await prisma.generation.upsert({
    where: { noteId_kind: { noteId: note.id, kind } },
    create: { noteId: note.id, kind, content },
    update: { content, createdAt: new Date() },
  });

  return NextResponse.json({ kind, content: generation.content, ai });
}
