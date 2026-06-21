import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, isResponse } from "@/lib/apiAuth";

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const { checkInId, questionKey, questionText, voiceRaw, isDynamic } =
      (await req.json()) as {
        checkInId: string;
        questionKey: string;
        questionText?: string;
        voiceRaw: string;
        isDynamic?: boolean;
      };

    // Verify ownership (session-scoped, never trust input userId).
    const checkIn = await prisma.checkIn.findFirst({
      where: { id: checkInId, userId },
    });
    if (!checkIn) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const entry = await prisma.journalEntry.create({
      data: {
        userId,
        checkInId,
        date: checkIn.date,
        type: checkIn.type,
        questionKey,
        questionText,
        isDynamic: Boolean(isDynamic),
        voiceRaw,
      },
    });

    // AI summary generation would run in background here; non-blocking.
    return NextResponse.json({ entryId: entry.id });
  } catch (err) {
    if (isResponse(err)) return err;
    console.error("[checkin/entry]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
