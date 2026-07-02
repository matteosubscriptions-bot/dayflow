import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH: aggiorna campi; azioni di comodo: {action:'done'} | {action:'defer'}.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const b = await req.json();
  const existing = await prisma.task.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "task non trovato" }, { status: 404 });

  let data: Record<string, unknown> = {};
  if (b.action === "done") {
    data = { status: "done", completedAt: new Date() };
  } else if (b.action === "defer") {
    data = { deferredCount: existing.deferredCount + 1 };
  } else if (b.action === "reopen") {
    data = { status: "todo", completedAt: null };
  } else {
    for (const k of ["title", "urgency", "importance", "status", "projectId", "supportsGoalId"]) {
      if (k in b) data[k] = b[k];
    }
    if ("dueDate" in b) data.dueDate = b.dueDate ? new Date(b.dueDate) : null;
    if ("scheduledDate" in b) data.scheduledDate = b.scheduledDate ? new Date(b.scheduledDate) : null;
  }
  const task = await prisma.task.update({ where: { id: params.id }, data });

  // Completare un task è avanzamento del progetto (per il pattern "fermo da 7+ giorni").
  if (b.action === "done" && task.projectId) {
    await prisma.project.update({
      where: { id: task.projectId },
      data: { lastProgressAt: new Date() },
    });
  }
  return NextResponse.json(task);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await prisma.task.update({ where: { id: params.id }, data: { status: "archived" } });
  return NextResponse.json({ ok: true });
}
