import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { userId, error } = await requireUserId();
  if (error) return error;

  const project = await prisma.project.findFirst({
    where: { id: params.id, userId },
  });
  if (!project) {
    return NextResponse.json({ error: "Progetto non trovato" }, { status: 404 });
  }

  const body = (await req.json()) as { name?: string; description?: string };
  await prisma.project.update({
    where: { id: project.id },
    data: {
      ...(body.name?.trim() ? { name: body.name.trim().slice(0, 120) } : {}),
      ...("description" in body ? { description: body.description?.trim() || null } : {}),
    },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { userId, error } = await requireUserId();
  if (error) return error;

  const project = await prisma.project.findFirst({
    where: { id: params.id, userId },
  });
  if (!project) {
    return NextResponse.json({ error: "Progetto non trovato" }, { status: 404 });
  }

  // Le note restano (projectId → null, gestito da onDelete: SetNull).
  await prisma.project.delete({ where: { id: project.id } });
  return NextResponse.json({ ok: true });
}
