import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const b = await req.json();
  for (const k of ["fromType", "fromId", "toType", "toId", "relation"]) {
    if (!b[k]) return NextResponse.json({ error: `${k} mancante` }, { status: 400 });
  }
  const link = await prisma.link.create({
    data: {
      fromType: b.fromType, fromId: b.fromId,
      toType: b.toType, toId: b.toId,
      relation: b.relation, createdBy: b.createdBy || "user",
    },
  });
  return NextResponse.json(link);
}
