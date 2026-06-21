import { NextRequest, NextResponse } from "next/server";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireUserId, isResponse } from "@/lib/apiAuth";
import { pickReflection, moodLevelFromMood } from "@/lib/reflections";
import type { HabitLog, MoodSelection } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const { checkInId, moodData, habitLogs, status } = (await req.json()) as {
      checkInId: string;
      moodData?: MoodSelection | null;
      habitLogs?: HabitLog[];
      status?: "completed" | "minimal" | "quick";
    };

    const checkIn = await prisma.checkIn.findFirst({ where: { id: checkInId, userId } });
    if (!checkIn) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.checkIn.update({
      where: { id: checkInId },
      data: { status: status ?? "completed", completedAt: new Date() },
    });

    if (moodData) {
      await prisma.mood.create({
        data: {
          userId,
          date: checkIn.date,
          time: format(new Date(), "HH:mm"),
          emoji: moodData.emoji,
          label: moodData.label,
          intensity: moodData.intensity,
          energy: moodData.energy,
        },
      });
    }

    if (habitLogs?.length) {
      await prisma.routineLog.createMany({
        data: habitLogs.map((h) => ({
          userId,
          habitId: h.habitId,
          date: checkIn.date,
          done: h.done,
        })),
      });
    }

    const moodLevel = moodLevelFromMood(moodData?.intensity, moodData?.energy);
    const reflection = pickReflection(moodLevel);

    await prisma.reflectionShown.create({
      data: {
        userId,
        date: checkIn.date,
        context: checkIn.type,
        messageType: "library",
        messageText: reflection.text,
        category: reflection.category,
      },
    });

    return NextResponse.json({ success: true, reflectiveMessage: reflection.text });
  } catch (err) {
    if (isResponse(err)) return err;
    console.error("[checkin/complete]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
