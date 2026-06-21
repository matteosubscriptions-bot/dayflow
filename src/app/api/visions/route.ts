import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, isResponse } from "@/lib/apiAuth";

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const { text, area, name, habits } = (await req.json()) as {
      text: string;
      area?: string;
      name?: string;
      habits?: string[];
    };

    if (name?.trim()) {
      await prisma.user.update({ where: { id: userId }, data: { name: name.trim() } });
    }

    let vision = null;
    if (text?.trim()) {
      vision = await prisma.vision.create({
        data: { userId, text: text.trim(), area },
      });
    }

    if (Array.isArray(habits) && habits.length) {
      const existing = await prisma.habit.count({ where: { userId } });
      await prisma.habit.createMany({
        data: habits
          .filter((h) => h.trim())
          .map((h, i) => ({ userId, name: h.trim(), sortOrder: existing + i })),
      });
    }

    return NextResponse.json({ vision });
  } catch (err) {
    if (isResponse(err)) return err;
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
