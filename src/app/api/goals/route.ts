import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, isResponse } from "@/lib/apiAuth";

export async function GET() {
  try {
    const userId = await requireUserId();
    const [visions, goals] = await Promise.all([
      prisma.vision.findMany({ where: { userId, isActive: true } }),
      prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    ]);
    return NextResponse.json({ visions, goals });
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
      area?: string;
      horizon?: string;
      whyDeep?: string;
      visionId?: string;
      parentId?: string;
      kpi?: string;
      // Optionally persist a reverse-engineered hierarchy in one call.
      hierarchy?: {
        milestones?: { title: string; horizon: string; kpi?: string }[];
        weeklyActions?: string[];
        tomorrowTasks?: string[];
      };
    };

    const goal = await prisma.goal.create({
      data: {
        userId,
        title: body.title,
        area: body.area,
        horizon: body.horizon ?? "12m",
        whyDeep: body.whyDeep,
        visionId: body.visionId,
        parentId: body.parentId,
        kpi: body.kpi,
      },
    });

    if (body.hierarchy) {
      const { milestones = [], weeklyActions = [], tomorrowTasks = [] } = body.hierarchy;
      for (const m of milestones) {
        await prisma.goal.create({
          data: {
            userId,
            parentId: goal.id,
            visionId: body.visionId,
            title: m.title,
            area: body.area,
            horizon: m.horizon || "3m",
            kpi: m.kpi,
          },
        });
      }
      for (const w of weeklyActions) {
        await prisma.weeklyAction.create({
          data: { userId, goalId: goal.id, weekStart: new Date(), title: w },
        });
      }
      for (const t of tomorrowTasks) {
        await prisma.task.create({
          data: { userId, goalId: goal.id, title: t, source: "reverse_engineering" },
        });
      }
    }

    return NextResponse.json({ goal });
  } catch (err) {
    if (isResponse(err)) return err;
    console.error("[goals POST]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
