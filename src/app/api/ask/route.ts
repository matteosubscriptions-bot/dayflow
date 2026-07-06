import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/apiAuth";
import { rankByQuery, type TermVector } from "@/lib/similarity";
import { noteFullText, excerpt } from "@/lib/noteText";
import { askBrain } from "@/lib/ai/ask";
import { isAIEnabled } from "@/lib/ai/client";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** POST /api/ask { question } — "Chiedi al tuo cervello" (RAG sulle note). */
export async function POST(req: NextRequest) {
  const { userId, error } = await requireUserId();
  if (error) return error;

  const { question } = (await req.json()) as { question: string };
  if (!question?.trim()) {
    return NextResponse.json({ error: "Domanda vuota" }, { status: 400 });
  }

  const notes = await prisma.note.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      contentHtml: true,
      transcript: true,
      tfVector: true,
    },
  });

  const ranked = rankByQuery(
    question,
    notes.map((n) => ({ doc: n, vector: (n.tfVector as TermVector) ?? {} })),
  ).slice(0, 5);

  const sources = ranked.map((r) => ({
    id: r.doc.id,
    title: r.doc.title,
    text: noteFullText(r.doc),
  }));

  const answer = await askBrain(question.trim(), sources);

  return NextResponse.json({
    answer,
    ai: isAIEnabled(),
    sources: ranked.map((r) => ({
      id: r.doc.id,
      title: r.doc.title,
      excerpt: excerpt(r.doc, 100),
    })),
  });
}
