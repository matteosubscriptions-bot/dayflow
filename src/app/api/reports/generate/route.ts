import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, isResponse } from "@/lib/apiAuth";
import { rateLimit } from "@/lib/rateLimit";
import { buildReport } from "@/lib/reports";
import { parseDate } from "@/lib/dates";

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    rateLimit(`ai:${userId}`); // narrative counts toward the AI budget

    const { type, periodStart, periodEnd } = (await req.json()) as {
      type: "daily" | "weekly" | "monthly";
      periodStart: string;
      periodEnd: string;
    };

    const start = parseDate(periodStart);
    const end = parseDate(periodEnd);

    const { content, narrative } = await buildReport(userId, type, start, end);

    const report = await prisma.report.create({
      data: {
        userId,
        type,
        periodStart: start,
        periodEnd: end,
        contentJson: JSON.stringify(content),
        narrative,
      },
    });

    return NextResponse.json({ reportId: report.id, status: "ready" });
  } catch (err) {
    if (isResponse(err)) return err;
    console.error("[reports/generate]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
