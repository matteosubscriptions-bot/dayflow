import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH campi; azione {action:'become-task'}: l'idea matura chiude il
// cerchio e diventa task, con link 'became_task' nel grafo (spec §3.1).
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const b = await req.json();
  const idea = await prisma.idea.findUnique({ where: { id: params.id } });
  if (!idea) return NextResponse.json({ error: "idea non trovata" }, { status: 404 });

  if (b.action === "become-task") {
    const task = await prisma.task.create({
      data: { title: idea.title, urgency: 3, importance: 4, captureId: idea.captureId },
    });
    const link = await prisma.link.create({
      data: { fromType: "idea", fromId: idea.id, toType: "task", toId: task.id, relation: "became_task" },
    });
    return NextResponse.json({ task, link });
  }

  const data: Record<string, unknown> = {};
  for (const k of ["title", "body", "maturity", "theme"]) if (k in b) data[k] = b[k];
  const updated = await prisma.idea.update({ where: { id: params.id }, data });
  return NextResponse.json(updated);
}
