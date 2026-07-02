// Agenti idee di OFFICINA: Creatività, Pensiero laterale, Systems
// thinking, Design thinking. L'output si appende al corpo dell'idea,
// firmato dal ruolo (gli agenti dichiarano chi sono).

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { chiamaAI, aiAvailable } from "@/lib/anthropic";
import { IDEA_AGENTS } from "@/lib/agents";

export async function POST(req: Request) {
  const { ideaId, agent } = await req.json();
  const spec = IDEA_AGENTS[agent];
  if (!spec) return NextResponse.json({ error: "agente sconosciuto" }, { status: 400 });
  const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
  if (!idea) return NextResponse.json({ error: "idea non trovata" }, { status: 404 });
  if (!aiAvailable()) {
    return NextResponse.json(
      { error: "Serve la rete e una API key per gli agenti. L'idea resta com'è." },
      { status: 503 }
    );
  }
  try {
    const out = await chiamaAI(spec.system, [
      { role: "user", content: `Idea: ${idea.title}\n${idea.body || ""}` },
    ], 400);
    const updated = await prisma.idea.update({
      where: { id: idea.id },
      data: { body: (idea.body ? idea.body + "\n\n" : "") + `— ${spec.label} —\n` + out },
    });
    return NextResponse.json({ idea: updated, output: out });
  } catch {
    return NextResponse.json({ error: "Agente non raggiungibile. L'idea resta com'è." }, { status: 502 });
  }
}
