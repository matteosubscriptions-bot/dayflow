"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  AGENT_PROFILE_LIST,
  AGENT_PROFILES,
  type AgentKind,
} from "@/lib/agentProfiles";

interface Message {
  role: "user" | "assistant";
  content: string;
  at: string;
}

interface Props {
  noteId: string;
}

/**
 * Sezione ELABORA CON: i tre agenti (Pamela, Simone, Corinne) elaborano la
 * nota, ognuno con la propria specialità, in una conversazione persistente.
 */
export function AgentsPanel({ noteId }: Props) {
  const [active, setActive] = useState<AgentKind | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const profile = active ? AGENT_PROFILES[active] : null;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, busy]);

  async function openAgent(agent: AgentKind) {
    setActive(agent);
    setMessages([]);
    const res = await fetch(`/api/notes/${noteId}/agent?agent=${agent}`);
    if (!res.ok) return;
    const data = (await res.json()) as { messages: Message[] };
    setMessages(data.messages);
    // Prima apertura: l'agente elabora subito la nota.
    if (data.messages.length === 0) send(agent, null);
  }

  async function send(agent: AgentKind, text: string | null) {
    setBusy(true);
    try {
      const res = await fetch(`/api/notes/${noteId}/agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent, message: text ?? undefined }),
      });
      if (res.ok) {
        const data = (await res.json()) as { messages: Message[] };
        setMessages(data.messages);
      }
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!active || !input.trim() || busy) return;
    const text = input.trim();
    setInput("");
    setMessages((m) => [
      ...m,
      { role: "user", content: text, at: new Date().toISOString() },
    ]);
    send(active, text);
  }

  return (
    <section className="framed">
      <h2 className="label">Elabora con</h2>
      <p className="mt-3 text-muted">
        Passa la nota a uno dei tuoi agenti: ognuno la lavora con la propria
        specialità e ricorda la conversazione.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {AGENT_PROFILE_LIST.map((a) => (
          <button
            key={a.id}
            onClick={() => openAgent(a.id)}
            className={`flex flex-col items-start gap-1 border p-4 text-left transition-colors ${
              active === a.id
                ? "border-ink bg-ink text-paper"
                : "border-ink/25 hover:border-ink"
            }`}
          >
            <span className="flex items-center gap-2">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full border font-display italic text-lg ${
                  active === a.id ? "border-paper/60" : "border-ink/40"
                }`}
              >
                {a.initial}
              </span>
              <span className="font-display italic text-xl">{a.name}</span>
            </span>
            <span
              className={`font-mono text-[10px] uppercase tracking-[0.15em] ${
                active === a.id ? "text-paper/70" : "text-muted"
              }`}
            >
              {a.role}
            </span>
            <span className={`mt-1 text-sm ${active === a.id ? "text-paper/85" : "text-muted"}`}>
              {a.description}
            </span>
          </button>
        ))}
      </div>

      {profile ? (
        <div className="mt-6 border-t border-ink/15 pt-6">
          <div
            ref={scrollRef}
            className="flex max-h-[28rem] flex-col gap-4 overflow-y-auto pr-1"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[92%] whitespace-pre-wrap border p-4 leading-relaxed ${
                  m.role === "user"
                    ? "self-end border-ink/20 bg-ink/5"
                    : "self-start border-ink/15 bg-paper"
                }`}
              >
                <p className="label-muted mb-2">
                  {m.role === "user" ? "Tu" : profile.name}
                </p>
                {m.content}
              </div>
            ))}
            {busy ? (
              <p className="self-start italic text-muted">
                {profile.name} sta scrivendo…
              </p>
            ) : null}
          </div>

          <form onSubmit={onSubmit} className="mt-4 flex items-center gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Rispondi a ${profile.name}…`}
              className="w-full border border-ink/25 bg-paper px-4 py-3 outline-none focus:border-ink"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="pill-solid pill-sm shrink-0"
            >
              Invia
            </button>
          </form>
        </div>
      ) : null}
    </section>
  );
}
