/** Testo "pieno" di una nota per indicizzazione e prompt AI. */
export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|blockquote)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function noteFullText(note: {
  title: string;
  contentHtml: string;
  transcript: string;
}): string {
  const body = stripHtml(note.contentHtml);
  // Il transcript è spesso già dentro il contenuto: evita il doppione.
  const extra = body.includes(note.transcript.slice(0, 80)) ? "" : note.transcript;
  return [note.title, body, extra].filter(Boolean).join("\n\n");
}

/** Anteprima breve per liste e ricerche. */
export function excerpt(note: { contentHtml: string; transcript: string }, len = 160): string {
  const text = stripHtml(note.contentHtml) || note.transcript;
  return text.length > len ? `${text.slice(0, len).trimEnd()}…` : text;
}
