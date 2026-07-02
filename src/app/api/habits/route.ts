import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const b = await req.json();
  if (!b.name?.trim()) return NextResponse.json({ error: "nome mancante" }, { status: 400 });
  const count = await prisma.habit.count();
  const habit = await prisma.habit.create({ data: { name: b.name.trim(), sortOrder: count } });
  return NextResponse.json(habit);
}
