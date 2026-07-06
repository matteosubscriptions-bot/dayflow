import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/apiAuth";
import { noteFullText } from "@/lib/noteText";
import { AGENTS, runAgent, type AgentKind, type AgentMessage } from "@/lib/ai/agents";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/notes/:id/agent { agent, message? }
 * Prima chiamata senza message: l'agente elabora la nota con la sua azione
 * di default. Chiamate successive: conversazione libera con l'agente.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { userId, error } = await requireUserId();
  if (error) return error;

  const note = await prisma.note.findFirst({ where: { id: params.id, userId } });
  if (!note) return NextResponse.json({ error: "Nota non trovata" }, { status: 404 });

  const body = (await req.json()) as { agent: AgentKind; message?: string };
  const profile = AGENTS[body.agent];
  if (!profile) {
    return NextResponse.json({ error: "Agente non valido" }, { status: 400 });
  }

  const thread = await prisma.agentThread.findUnique({
    where: { noteId_agent: { noteId: note.id, agent: body.agent } },
  });
  const history = (thread?.messages as unknown as AgentMessage[]) ?? [];

  const userMessage: AgentMessage = {
    role: "user",
    content: body.message?.trim() || profile.firstAction,
    at: new Date().toISOString(),
  };
  const newHistory = [...history, userMessage];

  const { content, ai } = await runAgent(
    body.agent,
    noteFullText(note),
    newHistory,
  );

  const assistantMessage: AgentMessage = {
    role: "assistant",
    content,
    at: new Date().toISOString(),
  };
  // Non persistere il messaggio "senza chiave AI": la conversazione riparte
  // pulita quando la chiave viene configurata.
  const toSave = ai ? [...newHistory, assistantMessage] : history;

  await prisma.agentThread.upsert({
    where: { noteId_agent: { noteId: note.id, agent: body.agent } },
    create: { noteId: note.id, agent: body.agent, messages: toSave as object[] },
    update: { messages: toSave as object[] },
  });

  return NextResponse.json({
    agent: body.agent,
    messages: ai ? toSave : [...newHistory, assistantMessage],
    ai,
  });
}

/** GET /api/notes/:id/agent?agent=PAMELA — thread esistente. */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { userId, error } = await requireUserId();
  if (error) return error;

  const note = await prisma.note.findFirst({ where: { id: params.id, userId } });
  if (!note) return NextResponse.json({ error: "Nota non trovata" }, { status: 404 });

  const agent = req.nextUrl.searchParams.get("agent") as AgentKind;
  if (!AGENTS[agent]) {
    return NextResponse.json({ error: "Agente non valido" }, { status: 400 });
  }

  const thread = await prisma.agentThread.findUnique({
    where: { noteId_agent: { noteId: note.id, agent } },
  });
  return NextResponse.json({ agent, messages: thread?.messages ?? [] });
}
