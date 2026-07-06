import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

/** DELETE /api/data — cancella tutte le note, i progetti e i tag dell'utente. */
export async function DELETE() {
  const { userId, error } = await requireUserId();
  if (error) return error;

  const [notes, projects, tags] = await prisma.$transaction([
    prisma.note.deleteMany({ where: { userId } }),
    prisma.project.deleteMany({ where: { userId } }),
    prisma.tag.deleteMany({ where: { userId } }),
  ]);

  return NextResponse.json({
    deleted: { notes: notes.count, projects: projects.count, tags: tags.count },
  });
}
