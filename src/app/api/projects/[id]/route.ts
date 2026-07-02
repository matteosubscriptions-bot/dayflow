import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const b = await req.json();
  const data: Record<string, unknown> = {};
  for (const k of ["name", "description", "status"]) if (k in b) data[k] = b[k];
  if (b.progress) data.lastProgressAt = new Date();
  const project = await prisma.project.update({ where: { id: params.id }, data });
  return NextResponse.json(project);
}
