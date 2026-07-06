import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/apiAuth";
import { similarityLinks, type TermVector } from "@/lib/similarity";

export const dynamic = "force-dynamic";

/**
 * GET /api/graph[?projectId=ID]
 * Nodi (note) e archi (similarità di contenuto) per il grafo delle
 * connessioni. Con projectId limita alle note del progetto (mindmap).
 */
export async function GET(req: NextRequest) {
  const { userId, error } = await requireUserId();
  if (error) return error;

  const projectId = req.nextUrl.searchParams.get("projectId");

  const notes = await prisma.note.findMany({
    where: { userId, ...(projectId ? { projectId } : {}) },
    select: {
      id: true,
      title: true,
      tfVector: true,
      projectId: true,
      project: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  const links = similarityLinks(
    notes.map((n) => ({ doc: n, vector: (n.tfVector as TermVector) ?? {} })),
  );

  return NextResponse.json({
    nodes: notes.map((n) => ({
      id: n.id,
      title: n.title,
      projectId: n.projectId,
      projectName: n.project?.name ?? null,
    })),
    links,
  });
}
