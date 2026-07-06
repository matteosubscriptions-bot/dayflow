import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/apiAuth";
import { termVector } from "@/lib/similarity";
import { noteFullText } from "@/lib/noteText";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** POST /api/reindex — ricalcola i vettori di tutte le note dell'utente. */
export async function POST() {
  const { userId, error } = await requireUserId();
  if (error) return error;

  const notes = await prisma.note.findMany({
    where: { userId },
    select: { id: true, title: true, contentHtml: true, transcript: true },
  });

  for (const n of notes) {
    await prisma.note.update({
      where: { id: n.id },
      data: { tfVector: termVector(noteFullText(n)) },
    });
  }

  return NextResponse.json({ reindexed: notes.length });
}
