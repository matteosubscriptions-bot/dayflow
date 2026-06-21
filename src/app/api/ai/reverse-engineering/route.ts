import { NextRequest, NextResponse } from "next/server";
import { requireUserId, isResponse } from "@/lib/apiAuth";
import { rateLimit } from "@/lib/rateLimit";
import { generateGoalReverseEngineering } from "@/lib/ai/reverseEngineering";

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const limited = rateLimit(`ai:${userId}`);
    if (!limited.ok) {
      return NextResponse.json({ error: "Rate limit" }, { status: 429 });
    }

    const { goalTitle, area, horizon, whyDeep } = (await req.json()) as {
      goalTitle: string;
      area: string;
      horizon: string;
      whyDeep: string;
    };

    const result = await generateGoalReverseEngineering(
      goalTitle ?? "",
      area ?? "",
      horizon ?? "12m",
      whyDeep ?? "",
    );

    return NextResponse.json(result);
  } catch (err) {
    if (isResponse(err)) return err;
    console.error("[ai/reverse-engineering]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
