// Obiettivi di vita: proprietà di SPECCHIO. OFFICINA li riceve in sola
// lettura via /api/state e li usa solo come filtro delle priorità.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const b = await req.json();
  if (!b.title?.trim()) return NextResponse.json({ error: "titolo mancante" }, { status: 400 });
  const goal = await prisma.lifeGoal.create({
    data: {
      title: b.title.trim(),
      horizon: ["vision", "12m", "quarter"].includes(b.horizon) ? b.horizon : "vision",
      area: b.area || null,
      whyDeep: b.whyDeep || null,
      alignment: b.alignment ? +b.alignment : null,
    },
  });
  return NextResponse.json(goal);
}
