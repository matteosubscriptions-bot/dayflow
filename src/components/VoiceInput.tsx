"use client";

import { useEffect, useRef, useState } from "react";
import { useVoice } from "@/hooks/useVoice";
import { Waveform } from "@/components/Waveform";

export interface VoiceInputProps {
  placeholder?: string;
  onConfirm: (text: string) => void;
  onSkip?: () => void;
  autoStart?: boolean;
  showSkip?: boolean;
}

/**
 * Reusable voice-first field (spec §5). Falls back to a textarea when the
 * Web Speech API is unsupported, denied, or after repeated errors.
 */
export function VoiceInput({
  placeholder = "Tocca per parlare…",
  onConfirm,
  onSkip,
  autoStart = true,
  showSkip = false,
}: VoiceInputProps) {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"voice" | "text">("voice");
  const errorCount = useRef(0);

  const {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    error,
    start,
    stop,
    reset,
  } = useVoice({
    onTranscript: (t) => setText(t),
    onError: () => {
      errorCount.current += 1;
      // After 3 consecutive errors, drop to text for the session (spec §15).
      if (errorCount.current >= 3) setMode("text");
    },
  });

  // Decide initial mode once support is known.
  useEffect(() => {
    if (!isSupported) setMode("text");
  }, [isSupported]);

  // Auto-start the mic 500ms after mount (spec §5).
  useEffect(() => {
    if (mode !== "voice" || !autoStart || !isSupported) return;
    const t = setTimeout(() => start(), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, autoStart, isSupported]);

  // A network/permission error forces the text fallback.
  useEffect(() => {
    if (error && /Scrivi|autorizzato/.test(error)) setMode("text");
  }, [error]);

  const handleConfirm = () => {
    const value = text.trim();
    if (!value) return;
    stop();
    onConfirm(value);
  };

  const handleRewrite = () => {
    setText("");
    reset();
    start();
  };

  const display = (transcript || text).trim();

  if (mode === "text") {
    return (
      <div className="flex flex-col gap-3">
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={error ?? "Scrivi qui la tua risposta…"}
          rows={4}
          className="w-full resize-none rounded-card border border-ink/10 bg-canvas p-4 text-ink outline-none focus:border-focus"
        />
        <div className="flex items-center justify-between">
          {isSupported && (
            <button
              type="button"
              className="btn-ghost text-sm"
              onClick={() => {
                setMode("voice");
                errorCount.current = 0;
              }}
            >
              Torna alla voce
            </button>
          )}
          <div className="ml-auto flex items-center gap-4">
            {showSkip && onSkip && (
              <button type="button" className="btn-ghost text-sm" onClick={onSkip}>
                Salta questa domanda
              </button>
            )}
            <button
              type="button"
              className="btn-primary"
              onClick={handleConfirm}
              disabled={!text.trim()}
            >
              Conferma
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <button
        type="button"
        onClick={() => (isListening ? stop() : start())}
        aria-label={isListening ? "Ferma registrazione" : "Avvia registrazione"}
        className="relative flex h-24 w-24 items-center justify-center rounded-full bg-focus text-white shadow-lg transition-transform active:scale-95"
      >
        {isListening && (
          <span className="absolute inset-0 animate-pulse-ring rounded-full bg-focus" />
        )}
        <MicIcon className="h-10 w-10" />
      </button>

      <Waveform active={isListening} />

      <p className="min-h-[3rem] max-w-md text-lg">
        {display ? (
          <span className="transcript-final">{display}</span>
        ) : interimTranscript ? (
          <span className="transcript-interim">{interimTranscript}</span>
        ) : (
          <span className="text-ink/40">{isListening ? "Ti ascolto…" : placeholder}</span>
        )}
        {interimTranscript && display && (
          <span className="transcript-interim"> {interimTranscript}</span>
        )}
      </p>

      {error && <p className="text-sm text-attention">{error}</p>}

      {display && (
        <div className="flex items-center gap-4">
          <button type="button" className="btn-ghost text-sm" onClick={handleRewrite}>
            Riscrivi
          </button>
          <button type="button" className="btn-primary" onClick={handleConfirm}>
            Conferma
          </button>
        </div>
      )}

      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          className="text-sm text-ink/40 underline-offset-2 hover:underline"
          onClick={() => {
            stop();
            setMode("text");
          }}
        >
          Preferisci scrivere?
        </button>
        {showSkip && onSkip && (
          <button type="button" className="text-sm text-ink/30 hover:text-ink/60" onClick={onSkip}>
            Salta questa domanda
          </button>
        )}
      </div>
    </div>
  );
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
    </svg>
  );
}
