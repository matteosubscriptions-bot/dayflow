import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

/** GET /api/projects — progetti con conteggio note. */
export async function GET() {
  const { userId, error } = await requireUserId();
  if (error) return error;

  const projects = await prisma.project.findMany({
    where: { userId },
    include: { _count: { select: { notes: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(
    projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      noteCount: p._count.notes,
    })),
  );
}

/** POST /api/projects { name, description? } */
export async function POST(req: NextRequest) {
  const { userId, error } = await requireUserId();
  if (error) return error;

  const body = (await req.json()) as { name?: string; description?: string };
  const name = body.name?.trim();
  if (!name) return NextResponse.json({ error: "Nome mancante" }, { status: 400 });

  const project = await prisma.project.create({
    data: { userId, name: name.slice(0, 120), description: body.description?.trim() || null },
  });
  return NextResponse.json(project, { status: 201 });
}
