// Motore di dialogo di SPECCHIO (spec §4): il Counselor riflette e fa
// UNA domanda. Il commutatore disagio è client-side: qui non arrivano
// mai contenuti bloccati (difesa in profondità: ricontrolliamo comunque
// l'ultimo turno e in quel caso non chiamiamo il cloud).

import { NextResponse } from "next/server";
import { chiamaAI, aiAvailable, dialogueFallback } from "@/lib/anthropic";
import { SYS_COUNSELOR } from "@/lib/agents";
import { detectDistress, MSG_DISAGIO } from "@/lib/router";
import type { ChatMsg } from "@/lib/anthropic";

export async function POST(req: Request) {
  const { messages } = (await req.json()) as { messages: ChatMsg[] };
  if (!Array.isArray(messages) || !messages.length) {
    return NextResponse.json({ error: "messaggi mancanti" }, { status: 400 });
  }

  const last = messages[messages.length - 1];
  if (last.role === "user" && detectDistress(last.content)) {
    return NextResponse.json({ reply: MSG_DISAGIO, local: true, distress: true });
  }

  if (!aiAvailable()) {
    return NextResponse.json({ reply: dialogueFallback(messages.length), local: true });
  }
  try {
    const reply = await chiamaAI(SYS_COUNSELOR, messages, 400);
    return NextResponse.json({ reply, local: false });
  } catch {
    return NextResponse.json({ reply: dialogueFallback(messages.length), local: true });
  }
}
