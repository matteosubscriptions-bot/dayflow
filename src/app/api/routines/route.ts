import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, isResponse } from "@/lib/apiAuth";

export async function GET() {
  try {
    const userId = await requireUserId();
    const routines = await prisma.routine.findMany({
      where: { userId, isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ routines });
  } catch (err) {
    if (isResponse(err)) return err;
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const { name, targetSlot, durationMin, category } = (await req.json()) as {
      name: string;
      targetSlot?: string;
      durationMin?: number;
      category?: string;
    };
    if (!name?.trim()) return NextResponse.json({ error: "Empty" }, { status: 400 });
    const count = await prisma.routine.count({ where: { userId } });
    const routine = await prisma.routine.create({
      data: { userId, name: name.trim(), targetSlot, durationMin, category, sortOrder: count },
    });
    return NextResponse.json({ routine });
  } catch (err) {
    if (isResponse(err)) return err;
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
