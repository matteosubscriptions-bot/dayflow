import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const b = await req.json();
  const data: Record<string, unknown> = {};
  for (const k of ["name", "isActive", "sortOrder"]) if (k in b) data[k] = b[k];
  const habit = await prisma.habit.update({ where: { id: params.id }, data });
  return NextResponse.json(habit);
}
