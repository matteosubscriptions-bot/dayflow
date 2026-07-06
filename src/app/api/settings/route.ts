import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

/** PATCH /api/settings { theme?, textScale? } — preferenze persistite. */
export async function PATCH(req: NextRequest) {
  const { userId, error } = await requireUserId();
  if (error) return error;

  const body = (await req.json()) as { theme?: string; textScale?: number };
  const data: Record<string, unknown> = {};
  if (body.theme === "light" || body.theme === "dark") data.theme = body.theme;
  if (
    typeof body.textScale === "number" &&
    body.textScale >= 70 &&
    body.textScale <= 150
  ) {
    data.textScale = Math.round(body.textScale);
  }

  await prisma.user.update({ where: { id: userId }, data });
  return NextResponse.json({ ok: true });
}
