import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/apiAuth";
import { noteFullText } from "@/lib/noteText";
import { summarize, extractKeyPoints, extractTodos } from "@/lib/ai/insights";
import { isAIEnabled } from "@/lib/ai/client";

export const dynamic = "force-dynamic";

/** POST /api/notes/:id/insights { kind: "summary" | "keypoints" | "todos" } */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { userId, error } = await requireUserId();
  if (error) return error;

  const note = await prisma.note.findFirst({
    where: { id: params.id, userId },
  });
  if (!note) return NextResponse.json({ error: "Nota non trovata" }, { status: 404 });

  const { kind } = (await req.json()) as { kind: string };
  const text = noteFullText(note);
  if (!text.trim()) {
    return NextResponse.json({ error: "La nota è vuota" }, { status: 400 });
  }

  if (kind === "summary") {
    const summary = await summarize(text);
    await prisma.note.update({ where: { id: note.id }, data: { summary } });
    return NextResponse.json({ summary, ai: isAIEnabled() });
  }

  if (kind === "keypoints") {
    const keyPoints = await extractKeyPoints(text);
    await prisma.note.update({ where: { id: note.id }, data: { keyPoints } });
    return NextResponse.json({ keyPoints, ai: isAIEnabled() });
  }

  if (kind === "todos") {
    const todos = await extractTodos(text);
    await prisma.note.update({ where: { id: note.id }, data: { todos } });
    return NextResponse.json({ todos, ai: isAIEnabled() });
  }

  return NextResponse.json({ error: "kind non valido" }, { status: 400 });
}
