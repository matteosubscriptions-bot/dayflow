"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { APP_NAME } from "@/lib/brand";

/** Blocco "Cattura un pensiero": nuova nota, registra, carica file. */
export function CaptureHero() {
  const router = useRouter();
  const openRecorder = useAppStore((s) => s.openRecorder);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function onFile(file: File) {
    setUploading(true);
    setUploadError(null);
    try {
      const buf = await file.arrayBuffer();
      // Base64 a blocchi per non superare lo stack con file grandi.
      const bytes = new Uint8Array(buf);
      let binary = "";
      const CHUNK = 0x8000;
      for (let i = 0; i < bytes.length; i += CHUNK) {
        binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
      }
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioBase64: btoa(binary),
          audioMime: file.type || "audio/mpeg",
          source: "UPLOAD",
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Caricamento non riuscito");
      }
      const data = (await res.json()) as { id: string; transcribed: boolean };
      router.push(`/note/${data.id}`);
      router.refresh();
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Caricamento non riuscito");
      setUploading(false);
    }
  }

  return (
    <section className="framed flex flex-col items-center py-12 text-center">
      <button
        onClick={openRecorder}
        aria-label="Registra"
        className="flex h-24 w-24 items-center justify-center rounded-full border border-ink/40 text-4xl font-light transition-colors hover:bg-ink hover:text-paper"
      >
        +
      </button>
      <h1 className="mt-6 font-display italic text-4xl sm:text-5xl">
        Cattura un pensiero
      </h1>
      <p className="mt-4 max-w-md text-muted">
        Registra a voce, carica un audio o scrivi. {APP_NAME} trascrive e
        struttura per te.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/note/new" className="pill-solid">
          <span className="text-xs">●</span> Nuova nota
        </Link>
        <button onClick={openRecorder} className="pill">
          Registra audio
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="pill"
        >
          {uploading ? "Carico…" : "Carica file"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = "";
          }}
        />
      </div>
      {uploadError ? (
        <p className="mt-4 text-sm text-red-700">{uploadError}</p>
      ) : null}
    </section>
  );
}
