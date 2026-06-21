import Link from "next/link";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoalTree } from "@/components/GoalTree";

export default async function GoalsPage() {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const [vision, goals] = await Promise.all([
    prisma.vision.findFirst({ where: { userId, isActive: true } }),
    prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Obiettivi</h1>
        <Link href="/goals/new" className="btn-primary text-sm">
          Nuovo
        </Link>
      </header>

      <GoalTree
        visionText={vision?.text}
        goals={goals.map((g) => ({
          id: g.id,
          title: g.title,
          horizon: g.horizon,
          progress: g.progress,
          status: g.status,
          parentId: g.parentId,
        }))}
        highlightLevel="week"
      />
    </div>
  );
}
