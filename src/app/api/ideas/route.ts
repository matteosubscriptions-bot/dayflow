import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const b = await req.json();
  if (!b.title?.trim()) return NextResponse.json({ error: "titolo mancante" }, { status: 400 });
  const idea = await prisma.idea.create({
    data: { title: b.title.trim(), body: b.body || null, theme: b.theme || null },
  });
  return NextResponse.json(idea);
}
