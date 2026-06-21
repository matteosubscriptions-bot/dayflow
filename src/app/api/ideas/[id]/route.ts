import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, isResponse } from "@/lib/apiAuth";

// Convert an idea into a task, or archive it.
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userId = await requireUserId();
    const idea = await prisma.idea.findFirst({ where: { id: params.id, userId } });
    if (!idea) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { action } = (await req.json()) as { action: "to_task" | "archive" };

    if (action === "to_task") {
      await prisma.task.create({
        data: { userId, title: idea.title, goalId: idea.goalId, source: "idea" },
      });
      await prisma.idea.update({ where: { id: idea.id }, data: { status: "task" } });
    } else if (action === "archive") {
      await prisma.idea.update({ where: { id: idea.id }, data: { status: "archived" } });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    if (isResponse(err)) return err;
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
