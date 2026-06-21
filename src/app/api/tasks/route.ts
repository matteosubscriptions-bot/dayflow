import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, isResponse } from "@/lib/apiAuth";

export async function GET() {
  try {
    const userId = await requireUserId();
    const tasks = await prisma.task.findMany({
      where: { userId, status: { not: "archived" } },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ tasks });
  } catch (err) {
    if (isResponse(err)) return err;
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = (await req.json()) as {
      title: string;
      priority?: "high" | "medium" | "low";
      goalId?: string;
      dueDate?: string;
    };
    const task = await prisma.task.create({
      data: {
        userId,
        title: body.title,
        priority: body.priority ?? "medium",
        goalId: body.goalId,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      },
    });
    return NextResponse.json({ task });
  } catch (err) {
    if (isResponse(err)) return err;
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
