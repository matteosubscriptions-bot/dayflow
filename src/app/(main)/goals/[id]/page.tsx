import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoalDetailControls } from "@/components/GoalDetailControls";

export default async function GoalDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const goal = await prisma.goal.findFirst({
    where: { id: params.id, userId },
    include: { children: true, weeklyActions: true, tasks: true },
  });
  if (!goal) notFound();

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Link href="/goals" className="btn-ghost text-sm">
        ← Obiettivi
      </Link>

      <header>
        <p className="meta">{goal.area ?? "Obiettivo"} · {goal.horizon}</p>
        <h1 className="mt-1 font-display text-3xl">{goal.title}</h1>
        {goal.whyDeep && (
          <p className="mt-3 text-ink/60 italic">“{goal.whyDeep}”</p>
        )}
      </header>

      <GoalDetailControls
        goalId={goal.id}
        initialProgress={goal.progress}
        initialStatus={goal.status}
      />

      {goal.children.length > 0 && (
        <section>
          <h2 className="meta mb-2">Milestone</h2>
          <ul className="flex flex-col gap-2">
            {goal.children.map((c) => (
              <li key={c.id} className="rounded-card bg-mist p-3 text-sm">
                {c.title}
              </li>
            ))}
          </ul>
        </section>
      )}

      {goal.weeklyActions.length > 0 && (
        <section>
          <h2 className="meta mb-2">Azioni settimanali</h2>
          <ul className="flex flex-col gap-2">
            {goal.weeklyActions.map((a) => (
              <li key={a.id} className="rounded-card bg-mist p-3 text-sm">
                {a.title}
              </li>
            ))}
          </ul>
        </section>
      )}

      {goal.tasks.length > 0 && (
        <section>
          <h2 className="meta mb-2">Task collegati</h2>
          <ul className="flex flex-col gap-2">
            {goal.tasks.map((t) => (
              <li key={t.id} className="rounded-card bg-mist p-3 text-sm">
                {t.title}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
