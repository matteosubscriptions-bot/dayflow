import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { ProjectsManager } from "@/components/ProjectsManager";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const userId = (await getCurrentUserId())!;
  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { notes: true } } },
  });

  return (
    <div>
      <p className="label-muted">Progetti</p>
      <h1 className="mt-2 font-display italic text-5xl">Le tue cartelle</h1>
      <p className="mt-4 max-w-lg text-muted">
        Raggruppa note e idee per progetto. Dalla pagina Connessioni puoi
        vedere la mindmap di ciascun progetto.
      </p>

      <ProjectsManager
        initialProjects={projects.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          noteCount: p._count.notes,
        }))}
      />
    </div>
  );
}
