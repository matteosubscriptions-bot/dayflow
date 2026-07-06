import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/apiAuth";
import { termVector } from "@/lib/similarity";
import { noteFullText, excerpt } from "@/lib/noteText";
import { titleAndTags } from "@/lib/ai/insights";
import { transcribeAudio, isSTTEnabled } from "@/lib/stt";

export const dynamic = "force-dynamic";

/** GET /api/notes?tag=NAME&projectId=ID — elenco note (senza audio). */
export async function GET(req: NextRequest) {
  const { userId, error } = await requireUserId();
  if (error) return error;

  const tag = req.nextUrl.searchParams.get("tag");
  const projectId = req.nextUrl.searchParams.get("projectId");

  const notes = await prisma.note.findMany({
    where: {
      userId,
      ...(projectId ? { projectId } : {}),
      ...(tag ? { tags: { some: { tag: { name: tag } } } } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      tags: { include: { tag: true } },
      project: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(
    notes.map((n) => ({
      id: n.id,
      title: n.title,
      excerpt: excerpt(n),
      status: n.status,
      source: n.source,
      hasAudio: Boolean(n.audioMime),
      createdAt: n.createdAt,
      project: n.project,
      tags: n.tags.map((t) => t.tag.name),
    })),
  );
}

interface CreateBody {
  title?: string;
  contentHtml?: string;
  transcript?: string;
  audioBase64?: string;
  audioMime?: string;
  audioDuration?: number;
  projectId?: string | null;
  source?: "TEXT" | "RECORDING" | "UPLOAD";
  createdAt?: string; // per note registrate offline e sincronizzate dopo
}

/** POST /api/notes — crea una nota (testo, registrazione o upload). */
export async function POST(req: NextRequest) {
  const { userId, error } = await requireUserId();
  if (error) return error;

  const body = (await req.json()) as CreateBody;
  const audio = body.audioBase64 ? Buffer.from(body.audioBase64, "base64") : null;
  if (audio && audio.length > 25 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Audio troppo grande (max 25 MB)" },
      { status: 413 },
    );
  }

  let transcript = (body.transcript ?? "").trim();

  // Nota audio senza trascrizione live (upload o registrata offline):
  // prova la trascrizione server-side, se configurata.
  let sttUsed = false;
  if (audio && !transcript && isSTTEnabled()) {
    const stt = await transcribeAudio(audio, body.audioMime ?? "audio/webm");
    if (stt) {
      transcript = stt;
      sttUsed = true;
    }
  }

  const contentHtml =
    body.contentHtml?.trim() ||
    (transcript
      ? transcript
          .split(/\n{2,}/)
          .map((p) => `<p>${p.trim()}</p>`)
          .join("")
      : "");

  const fullText = [body.title, transcript, contentHtml].filter(Boolean).join("\n");

  // Titolo + tag suggeriti (AI con fallback locale) solo se c'è del testo
  // e l'utente non ha già dato un titolo.
  let title = body.title?.trim() ?? "";
  let suggestedTags: string[] = [];
  if (fullText.trim()) {
    const existing = await prisma.tag.findMany({
      where: { userId },
      select: { name: true },
    });
    const suggestion = await titleAndTags(
      transcript || contentHtml,
      existing.map((t) => t.name),
    );
    if (!title) title = suggestion.title;
    suggestedTags = suggestion.tags;
  }
  if (!title) title = "Senza titolo";

  const note = await prisma.note.create({
    data: {
      userId,
      title,
      contentHtml,
      transcript,
      source: body.source ?? (audio ? "RECORDING" : "TEXT"),
      status: "DRAFT",
      projectId: body.projectId || null,
      audioData: audio ?? undefined,
      audioMime: audio ? (body.audioMime ?? "audio/webm") : undefined,
      audioDuration: body.audioDuration ?? undefined,
      tfVector: termVector(noteFullText({ title, contentHtml, transcript })),
      ...(body.createdAt ? { createdAt: new Date(body.createdAt) } : {}),
    },
  });

  // Collega i tag suggeriti (creandoli se nuovi).
  for (const name of suggestedTags) {
    const tag = await prisma.tag.upsert({
      where: { userId_name: { userId, name } },
      create: { userId, name },
      update: {},
    });
    await prisma.noteTag.create({ data: { noteId: note.id, tagId: tag.id } });
  }

  return NextResponse.json(
    { id: note.id, title: note.title, transcribed: Boolean(transcript), sttUsed },
    { status: 201 },
  );
}
