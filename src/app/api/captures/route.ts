// Cattura: il grezzo si salva subito, così com'è. Il router locale
// (condiviso col client) calcola solo il suggerimento di dominio.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { routeCapture } from "@/lib/router";

export async function POST(req: Request) {
  const body = await req.json();
  const raw = (body.raw || "").trim();
  if (!raw) return NextResponse.json({ error: "testo vuoto" }, { status: 400 });

  const r = routeCapture(raw);
  const capture = await prisma.capture.create({
    data: {
      raw,
      source: body.source === "voice" ? "voice" : "text",
      surface: body.surface || null,
      suggested: r.domain,
      ambiguous: r.ambiguous,
    },
  });
  return NextResponse.json(capture);
}
