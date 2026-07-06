import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/apiAuth";
import { rankByQuery, type TermVector } from "@/lib/similarity";
import { excerpt } from "@/lib/noteText";
import { shortDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

/** GET /api/search?q=... — ricerca semantica (TF-IDF) + match diretto. */
export async function GET(req: NextRequest) {
  const { userId, error } = await requireUserId();
  if (error) return error;

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (!q) return NextResponse.json([]);

  const notes = await prisma.note.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      contentHtml: true,
      transcript: true,
      createdAt: true,
      tfVector: true,
      tags: { include: { tag: true } },
    },
  });

  const ranked = rankByQuery(
    q,
    notes.map((n) => ({ doc: n, vector: (n.tfVector as TermVector) ?? {} })),
  );

  // Le corrispondenze letterali (titolo/testo) vengono sempre incluse.
  const lower = q.toLowerCase();
  const literal = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(lower) ||
      n.transcript.toLowerCase().includes(lower) ||
      n.contentHtml.toLowerCase().includes(lower),
  );

  const seen = new Set<string>();
  const results = [...ranked.map((r) => r.doc), ...literal]
    .filter((n) => (seen.has(n.id) ? false : (seen.add(n.id), true)))
    .slice(0, 12);

  return NextResponse.json(
    results.map((n) => ({
      id: n.id,
      title: n.title,
      excerpt: excerpt(n, 120),
      date: shortDate(n.createdAt),
      tags: n.tags.map((t) => t.tag.name),
    })),
  );
}
