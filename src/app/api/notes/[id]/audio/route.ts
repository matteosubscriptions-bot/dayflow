import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

/** GET /api/notes/:id/audio — restituisce l'audio originale della nota. */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { userId, error } = await requireUserId();
  if (error) return error;

  const note = await prisma.note.findFirst({
    where: { id: params.id, userId },
    select: { audioData: true, audioMime: true },
  });
  if (!note?.audioData) {
    return NextResponse.json({ error: "Audio non presente" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(note.audioData), {
    headers: {
      "Content-Type": note.audioMime ?? "audio/webm",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
