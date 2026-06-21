import { NextRequest, NextResponse } from "next/server";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireUserId, isResponse } from "@/lib/apiAuth";

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const { emoji, label, intensity, energy, voiceNote, context } =
      (await req.json()) as {
        emoji?: string;
        label?: string;
        intensity?: number;
        energy?: number;
        voiceNote?: string;
        context?: string;
      };
    const mood = await prisma.mood.create({
      data: {
        userId,
        date: new Date(),
        time: format(new Date(), "HH:mm"),
        emoji,
        label,
        intensity,
        energy,
        voiceNote,
        context,
      },
    });
    return NextResponse.json({ mood });
  } catch (err) {
    if (isResponse(err)) return err;
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
