"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

/** Nuova nota testuale: titolo opzionale + testo, poi si apre l'editor. */
export default function NewNotePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    const contentHtml = text
      .split(/\n{2,}/)
      .map((p) => `<p>${p.trim().replace(/\n/g, "<br>")}</p>`)
      .join("");
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim() || undefined,
        contentHtml,
        transcript: text.trim(),
        source: "TEXT",
      }),
    });
    if (res.ok) {
      const data = (await res.json()) as { id: string };
      router.push(`/note/${data.id}`);
      router.refresh();
    } else {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <p className="label-muted">Nuova nota</p>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Titolo (lascia vuoto: lo suggerisce l'AI)"
        className="border-b border-ink/20 bg-transparent pb-2 font-display italic text-4xl outline-none placeholder:text-muted/50 focus:border-ink"
      />
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Scrivi il tuo pensiero…"
        rows={10}
        required
        className="border border-ink/20 bg-card p-5 font-display text-xl leading-relaxed outline-none focus:border-ink"
      />
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="pill pill-sm"
        >
          Annulla
        </button>
        <button type="submit" disabled={saving || !text.trim()} className="pill-solid">
          {saving ? "Salvo…" : "Salva nota"}
        </button>
      </div>
    </form>
  );
}
