import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { GraphExplorer } from "@/components/GraphExplorer";

export const dynamic = "force-dynamic";

export default async function ConnectionsPage() {
  const userId = (await getCurrentUserId())!;
  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div>
      <p className="label-muted">Connessioni</p>
      <h1 className="mt-2 font-display italic text-5xl">
        Il tuo arcipelago di pensieri
      </h1>
      <p className="mt-4 max-w-lg text-muted">
        Ogni nodo è una nota. Due note sono collegate quando il loro contenuto
        si somiglia abbastanza. Trascina, ingrandisci, esplora — oppure scegli
        un progetto per vedere la mindmap centrata sulla sua idea.
      </p>

      <GraphExplorer projects={projects} />
    </div>
  );
}
