// Il ritratto evolutivo: un tratto si conserva solo su conferma
// dell'utente, dal dialogo. È un ritratto in movimento, non un'etichetta.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const b = await req.json();
  if (!b.trait?.trim()) return NextResponse.json({ error: "tratto mancante" }, { status: 400 });
  const trait = await prisma.profileTrait.create({
    data: {
      trait: b.trait.trim(),
      evidence: b.evidence || "dal dialogo",
      confidence: b.confidence ? +b.confidence : 0.6,
    },
  });
  return NextResponse.json(trait);
}
