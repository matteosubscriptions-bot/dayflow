import { NextRequest, NextResponse } from "next/server";
import { subDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireUserId, isResponse } from "@/lib/apiAuth";
import { rateLimit } from "@/lib/rateLimit";
import { dayRange } from "@/lib/dates";
import { generateDynamicQuestions } from "@/lib/ai/questions";
import type { LiveCheckInType } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const { type, date } = (await req.json()) as {
      type: LiveCheckInType;
      date?: string;
    };
    const day = date ? new Date(date) : new Date();

    // Recover an existing draft for the same day/type (spec §8).
    const existingDraft = await prisma.checkIn.findFirst({
      where: { userId, type, date: dayRange(day), status: { in: ["pending", "in_progress"] } },
      include: { journalEntries: true },
    });

    const checkIn =
      existingDraft ??
      (await prisma.checkIn.create({
        data: { userId, type, date: day, startedAt: new Date(), status: "in_progress" },
      }));

    // Gather recent questions + patterns for dynamic generation.
    const [recentEntries, patterns] = await Promise.all([
      prisma.journalEntry.findMany({
        where: { userId, isDynamic: true, createdAt: { gte: subDays(new Date(), 14) } },
        select: { questionText: true },
      }),
      prisma.pattern.findMany({
        where: { userId, usedInQuestion: false },
        orderBy: { detectedAt: "desc" },
        take: 5,
      }),
    ]);

    let dynamicQuestions: string[] = [];
    const limited = rateLimit(`ai:${userId}`);
    if (limited.ok) {
      dynamicQuestions = await generateDynamicQuestions(
        type,
        patterns.map((p) => ({ patternType: p.patternType, description: p.description })),
        recentEntries.map((e) => e.questionText ?? "").filter(Boolean),
      );
      if (patterns.length) {
        await prisma.pattern.updateMany({
          where: { id: { in: patterns.map((p) => p.id) } },
          data: { usedInQuestion: true },
        });
      }
    }

    return NextResponse.json({
      checkInId: checkIn.id,
      dynamicQuestions,
      existingDraft: existingDraft
        ? { answeredKeys: existingDraft.journalEntries.map((e) => e.questionKey) }
        : undefined,
    });
  } catch (err) {
    if (isResponse(err)) return err;
    console.error("[checkin/start]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
