import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

/** GET /api/tags — tag dell'utente con conteggio note. */
export async function GET() {
  const { userId, error } = await requireUserId();
  if (error) return error;

  const tags = await prisma.tag.findMany({
    where: { userId },
    include: { _count: { select: { notes: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(
    tags.map((t) => ({ id: t.id, name: t.name, count: t._count.notes })),
  );
}
