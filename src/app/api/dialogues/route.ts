// Storico dei dialoghi: si salva alla chiusura, col transcript completo.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  if (!Array.isArray(body.transcript) || body.transcript.length < 2) {
    return NextResponse.json({ error: "transcript vuoto" }, { status: 400 });
  }
  const dialogue = await prisma.dialogue.create({
    data: {
      transcript: body.transcript,
      topic: body.topic || null,
      insight: body.insight || null,
      distress: Boolean(body.distress),
    },
  });
  return NextResponse.json(dialogue);
}
