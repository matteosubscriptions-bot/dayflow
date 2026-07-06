"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRecorder } from "@/hooks/useRecorder";
import { useAppStore } from "@/store/useAppStore";
import { enqueueNote, pendingCount } from "@/lib/offlineQueue";
import { formatDuration } from "@/lib/dates";
import { MicIcon } from "@/components/FloatingRecorder";

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      resolve(dataUrl.slice(dataUrl.indexOf(",") + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** Pannello modale di registrazione con trascrizione live. */
export function RecorderPanel() {
  const router = useRouter();
  const closeRecorder = useAppStore((s) => s.closeRecorder);
  const setPendingSync = useAppStore((s) => s.setPendingSync);
  const recorder = useRecorder();
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Avvia subito la registrazione all'apertura del pannello.
  useEffect(() => {
    recorder.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onStop() {
    setSaving(true);
    const result = await recorder.stop();
    if (!result || (!result.audioBlob && !result.transcript)) {
      closeRecorder();
      return;
    }

    const audioBase64 = result.audioBlob
      ? await blobToBase64(result.audioBlob)
      : null;
    const payload = {
      transcript: result.transcript,
      audioBase64,
      audioMime: result.audioMime,
      audioDuration: result.duration,
      source: "RECORDING" as const,
    };

    try {
      if (!navigator.onLine) throw new Error("offline");
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("save failed");
      const data = (await res.json()) as { id: string };
      closeRecorder();
      router.push(`/note/${data.id}`);
      router.refresh();
    } catch {
      // Offline (o errore di rete): metti in coda e sincronizza più tardi.
      await enqueueNote({
        audioBase64,
        audioMime: result.audioMime,
        audioDuration: result.duration,
        transcript: result.transcript,
        createdAt: new Date().toISOString(),
      });
      setPendingSync(await pendingCount());
      setNotice(
        "Sei offline: la nota è salvata sul dispositivo e verrà sincronizzata automaticamente.",
      );
      setSaving(false);
    }
  }

  function onCancel() {
    recorder.cancel();
    closeRecorder();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
      <div className="w-full max-w-lg animate-slide-up border border-line bg-card p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <span className="label">Registrazione</span>
          <span className="font-mono text-lg tabular-nums">
            {formatDuration(recorder.seconds)}
          </span>
        </div>

        {recorder.error ? (
          <p className="mt-6 text-sm text-red-700">{recorder.error}</p>
        ) : (
          <>
            {/* Waveform reattiva al livello del microfono */}
            <div className="mt-6 flex h-14 items-center justify-center gap-1">
              {Array.from({ length: 24 }).map((_, i) => (
                <span
                  key={i}
                  className="w-1.5 rounded-full bg-ink/70 animate-wave"
                  style={{
                    height: `${18 + Math.round(recorder.level * 34 * ((i % 5) + 1) / 5)}px`,
                    animationDelay: `${(i % 6) * 0.12}s`,
                  }}
                />
              ))}
            </div>

            <div className="mt-4 min-h-[72px] max-h-40 overflow-y-auto border border-ink/15 bg-paper p-4 font-display text-lg leading-relaxed">
              {recorder.liveTranscript || recorder.interim ? (
                <>
                  {recorder.liveTranscript}{" "}
                  <span className="text-muted">{recorder.interim}</span>
                </>
              ) : (
                <span className="text-muted">
                  {recorder.speechSupported && navigator.onLine
                    ? "Parla: la trascrizione appare qui…"
                    : "Sto registrando l'audio. La trascrizione verrà fatta al salvataggio (serve una chiave STT) o puoi scriverla a mano."}
                </span>
              )}
            </div>
          </>
        )}

        {notice ? (
          <p className="mt-4 border border-ink/20 bg-paper p-3 font-mono text-xs uppercase tracking-[0.15em]">
            {notice}
          </p>
        ) : null}

        <div className="mt-6 flex items-center justify-between gap-3">
          <button onClick={onCancel} className="pill pill-sm" disabled={saving}>
            Annulla
          </button>
          {notice ? (
            <button onClick={closeRecorder} className="pill-solid pill-sm">
              Chiudi
            </button>
          ) : (
            <button
              onClick={onStop}
              disabled={saving || !recorder.isRecording}
              className="pill-solid"
            >
              <MicIcon className="h-4 w-4" />
              {saving ? "Salvo…" : "Stop e salva"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
