import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, isResponse } from "@/lib/apiAuth";

export async function GET() {
  try {
    const userId = await requireUserId();
    const ideas = await prisma.idea.findMany({
      where: { userId, status: { not: "archived" } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ ideas });
  } catch (err) {
    if (isResponse(err)) return err;
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
