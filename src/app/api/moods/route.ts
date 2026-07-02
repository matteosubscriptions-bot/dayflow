// Check-in leggeri: umore ED energia, separati. La gratitudine entra
// qui come voce con label 'gratitudine' (innesco del dialogo).

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const b = await req.json();
  const now = new Date();
  const mood = await prisma.mood.create({
    data: {
      date: b.date || now.toISOString().slice(0, 10),
      time: b.time || now.toTimeString().slice(0, 5),
      label: b.label || "check-in",
      moodIntensity: b.moodIntensity != null ? +b.moodIntensity : null,
      energy: b.energy != null ? +b.energy : null,
      context: b.context || null,
    },
  });
  return NextResponse.json(mood);
}
