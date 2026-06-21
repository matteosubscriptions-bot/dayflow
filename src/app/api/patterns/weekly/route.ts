import { NextResponse } from "next/server";
import { requireUserId, isResponse } from "@/lib/apiAuth";
import { analyzeWeeklyPatterns } from "@/lib/patterns";

export async function GET() {
  try {
    const userId = await requireUserId();
    const { summary, patterns } = await analyzeWeeklyPatterns(userId);
    return NextResponse.json({ patterns, summary });
  } catch (err) {
    if (isResponse(err)) return err;
    console.error("[patterns/weekly]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
