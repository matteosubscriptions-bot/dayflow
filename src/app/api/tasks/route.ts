import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const b = await req.json();
  if (!b.title?.trim()) return NextResponse.json({ error: "titolo mancante" }, { status: 400 });
  const task = await prisma.task.create({
    data: {
      title: b.title.trim(),
      projectId: b.projectId || null,
      urgency: +b.urgency || 3,
      importance: +b.importance || 3,
      supportsGoalId: b.supportsGoalId || null,
      dueDate: b.dueDate ? new Date(b.dueDate) : null,
      scheduledDate: b.scheduledDate ? new Date(b.scheduledDate) : null,
    },
  });
  // Il ponte fare→identità, tracciato anche nel grafo.
  if (task.supportsGoalId) {
    await prisma.link.create({
      data: { fromType: "task", fromId: task.id, toType: "life_goal", toId: task.supportsGoalId, relation: "supports_goal" },
    });
  }
  return NextResponse.json(task);
}
