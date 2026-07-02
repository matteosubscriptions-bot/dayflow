// Sovranità del dato (spec §9): export completo in JSON aperto,
// sempre disponibile, un click.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const [captures, links, tags, entityTags, goals, projects, tasks, ideas, dialogues, moods, habits, habitLogs, traits, reports] =
    await Promise.all([
      prisma.capture.findMany(),
      prisma.link.findMany(),
      prisma.tag.findMany(),
      prisma.entityTag.findMany(),
      prisma.lifeGoal.findMany(),
      prisma.project.findMany(),
      prisma.task.findMany(),
      prisma.idea.findMany(),
      prisma.dialogue.findMany(),
      prisma.mood.findMany(),
      prisma.habit.findMany(),
      prisma.habitLog.findMany(),
      prisma.profileTrait.findMany(),
      prisma.report.findMany(),
    ]);

  const dump = {
    exportedAt: new Date().toISOString(),
    schema: "officina-specchio-v2",
    captures, links, tags, entityTags,
    lifeGoals: goals, projects, tasks, ideas,
    dialogues, moods, habits, habitLogs,
    profileTraits: traits, reports,
  };

  return new NextResponse(JSON.stringify(dump, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="officina-specchio-export-${dump.exportedAt.slice(0, 10)}.json"`,
    },
  });
}
