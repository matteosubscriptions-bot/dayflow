import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const b = await req.json();
  if (!b.name?.trim()) return NextResponse.json({ error: "nome mancante" }, { status: 400 });
  const project = await prisma.project.create({
    data: { name: b.name.trim(), description: b.description || null, lastProgressAt: new Date() },
  });
  return NextResponse.json(project);
}
