import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, isResponse } from "@/lib/apiAuth";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userId = await requireUserId();
    const report = await prisma.report.findFirst({
      where: { id: params.id, userId },
    });
    if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
      report: {
        ...report,
        content: report.contentJson ? JSON.parse(report.contentJson) : null,
      },
      status: "ready",
    });
  } catch (err) {
    if (isResponse(err)) return err;
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
