import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, isResponse } from "@/lib/apiAuth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userId = await requireUserId();
    const owned = await prisma.task.findFirst({ where: { id: params.id, userId } });
    if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = (await req.json()) as {
      action?: "complete" | "defer" | "archive" | "reopen";
      title?: string;
      priority?: "high" | "medium" | "low";
    };

    const data: Record<string, unknown> = {};
    if (body.title) data.title = body.title;
    if (body.priority) data.priority = body.priority;
    switch (body.action) {
      case "complete":
        data.status = "done";
        data.completedAt = new Date();
        break;
      case "defer":
        data.status = "deferred";
        data.deferCount = owned.deferCount + 1;
        break;
      case "archive":
        data.status = "archived";
        break;
      case "reopen":
        data.status = "todo";
        data.completedAt = null;
        break;
    }

    const task = await prisma.task.update({ where: { id: params.id }, data });
    return NextResponse.json({ task });
  } catch (err) {
    if (isResponse(err)) return err;
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
