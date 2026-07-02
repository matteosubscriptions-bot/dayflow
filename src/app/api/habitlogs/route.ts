// Spunta serale delle abitudini: POST fa il toggle su (habitId, date).

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const b = await req.json();
  if (!b.habitId || !b.date) return NextResponse.json({ error: "habitId/date mancanti" }, { status: 400 });
  const existing = await prisma.habitLog.findUnique({
    where: { habitId_date: { habitId: b.habitId, date: b.date } },
  });
  if (existing) {
    const log = await prisma.habitLog.update({
      where: { id: existing.id },
      data: { done: !existing.done },
    });
    return NextResponse.json(log);
  }
  const log = await prisma.habitLog.create({
    data: { habitId: b.habitId, date: b.date, done: true },
  });
  return NextResponse.json(log);
}
