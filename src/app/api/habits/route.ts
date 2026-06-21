import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, isResponse } from "@/lib/apiAuth";

export async function GET() {
  try {
    const userId = await requireUserId();
    const habits = await prisma.habit.findMany({
      where: { userId, isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ habits });
  } catch (err) {
    if (isResponse(err)) return err;
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const { name, category } = (await req.json()) as { name: string; category?: string };
    if (!name?.trim()) return NextResponse.json({ error: "Empty" }, { status: 400 });
    const count = await prisma.habit.count({ where: { userId } });
    const habit = await prisma.habit.create({
      data: { userId, name: name.trim(), category, sortOrder: count },
    });
    return NextResponse.json({ habit });
  } catch (err) {
    if (isResponse(err)) return err;
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
