import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const b = await req.json();
  const data: Record<string, unknown> = {};
  for (const k of ["title", "horizon", "area", "whyDeep", "alignment", "isActive"]) {
    if (k in b) data[k] = b[k];
  }
  const goal = await prisma.lifeGoal.update({ where: { id: params.id }, data });
  return NextResponse.json(goal);
}
