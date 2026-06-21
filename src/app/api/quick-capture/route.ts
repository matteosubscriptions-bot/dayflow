import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, isResponse } from "@/lib/apiAuth";
import { rateLimit } from "@/lib/rateLimit";
import { aiComplete, parseJSON } from "@/lib/ai/client";
import { anonymizeForAI } from "@/lib/anonymize";
import type { QuickCaptureType } from "@/types";

// One generative follow-up question per idea capture (spec §13).
const IDEA_FOLLOWUPS = [
  "Cosa ti ha fatto venire in mente questa idea?",
  "Qual è il primo passo, se la prendessi sul serio?",
  "A quale obiettivo potrebbe collegarsi?",
];

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const { type, text, priority } = (await req.json()) as {
      type: QuickCaptureType;
      text: string;
      priority?: "high" | "medium" | "low";
    };

    const clean = (text ?? "").trim();
    if (!clean) return NextResponse.json({ error: "Empty" }, { status: 400 });

    if (type === "task") {
      await prisma.task.create({
        data: {
          userId,
          title: clean.slice(0, 200),
          priority: priority ?? "medium",
          status: "todo",
          source: "quick_capture",
        },
      });
      return NextResponse.json({ message: "Task salvato." });
    }

    if (type === "idea") {
      let title = clean.slice(0, 80);
      let project: string | null = null;
      let tags: string[] = [];

      const limited = rateLimit(`ai:${userId}`);
      if (limited.ok) {
        const raw = await aiComplete(
          `Da questa idea (anonima): "${anonymizeForAI(clean)}"
Suggerisci un titolo breve, un progetto e 1-3 tag.
Rispondi SOLO con JSON: {"title":"...","project":"...","tags":["..."]}`,
          { maxTokens: 200 },
        );
        const parsed = parseJSON<{ title?: string; project?: string; tags?: string[] }>(raw);
        if (parsed) {
          title = parsed.title?.slice(0, 80) ?? title;
          project = parsed.project ?? null;
          tags = Array.isArray(parsed.tags) ? parsed.tags.slice(0, 3) : [];
        }
      }

      await prisma.idea.create({
        data: {
          userId,
          title,
          body: clean,
          project,
          tags: tags.length ? JSON.stringify(tags) : null,
          voiceRaw: clean,
          status: "raw",
        },
      });

      const followup = IDEA_FOLLOWUPS[Math.floor(Math.random() * IDEA_FOLLOWUPS.length)];
      return NextResponse.json({ message: `Idea catturata. ${followup}` });
    }

    // thought / note → free journal entry
    await prisma.journalEntry.create({
      data: {
        userId,
        date: new Date(),
        type: "free",
        questionKey: type,
        voiceRaw: clean,
      },
    });
    return NextResponse.json({ message: "Salvato nel journal." });
  } catch (err) {
    if (isResponse(err)) return err;
    console.error("[quick-capture]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
