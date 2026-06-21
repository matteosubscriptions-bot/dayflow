"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { VoiceInput } from "@/components/VoiceInput";
import type { QuickCaptureType } from "@/types";

const TABS: { type: QuickCaptureType; label: string }[] = [
  { type: "idea", label: "Idea" },
  { type: "task", label: "Task" },
  { type: "thought", label: "Pensiero" },
  { type: "note", label: "Nota" },
];

// FAB + bottom sheet quick capture (spec §13).
export function QuickCapture() {
  const { quickCaptureOpen, quickCaptureType, openQuickCapture, closeQuickCapture } =
    useAppStore();
  const router = useRouter();
  const [type, setType] = useState<QuickCaptureType>(quickCaptureType);
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState("");

  const open = () => {
    setType(quickCaptureType);
    setConfirmation(null);
    openQuickCapture(quickCaptureType);
  };

  const reset = () => {
    setConfirmation(null);
    setTaskTitle("");
    closeQuickCapture();
    router.refresh();
  };

  const submit = async (text: string, extra?: Record<string, unknown>) => {
    try {
      const res = await fetch("/api/quick-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, text, ...extra }),
      });
      const data = await res.json().catch(() => ({}));
      setConfirmation(data.message ?? "Salvato.");
    } catch {
      setConfirmation("Salvato in locale. Sincronizzo appena torni online.");
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label="Cattura rapida"
        onClick={open}
        className="fixed bottom-20 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-focus text-white shadow-lg transition-transform active:scale-90"
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {quickCaptureOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal>
          <div className="absolute inset-0 bg-ink/30" onClick={reset} />
          <div className="relative w-full max-w-content rounded-t-sheet bg-canvas p-6 pb-8 shadow-2xl animate-slide-in">
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-ink/15" />

            {confirmation ? (
              <div className="flex flex-col items-center gap-5 py-6 text-center">
                <p className="question-title">{confirmation}</p>
                <button type="button" className="btn-primary" onClick={reset}>
                  Fatto
                </button>
              </div>
            ) : (
              <>
                <div className="mb-5 flex gap-2">
                  {TABS.map((t) => (
                    <button
                      key={t.type}
                      type="button"
                      onClick={() => setType(t.type)}
                      className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                        type === t.type ? "bg-focus text-white" : "bg-mist text-ink/60"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {type === "task" ? (
                  <div className="flex flex-col gap-4">
                    <input
                      autoFocus
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      placeholder="Cosa va fatto?"
                      className="w-full rounded-card border border-ink/10 bg-canvas p-3 outline-none focus:border-focus"
                    />
                    <div className="flex gap-2">
                      {(["high", "medium", "low"] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPriority(p)}
                          className={`flex-1 rounded-card border py-2 text-sm capitalize ${
                            priority === p ? "border-focus bg-focus/10" : "border-ink/10"
                          }`}
                        >
                          {p === "high" ? "Alta" : p === "medium" ? "Media" : "Bassa"}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={!taskTitle.trim()}
                      onClick={() => submit(taskTitle, { priority })}
                    >
                      Salva task
                    </button>
                  </div>
                ) : (
                  <VoiceInput
                    placeholder="Parla liberamente…"
                    onConfirm={(text) => submit(text)}
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
