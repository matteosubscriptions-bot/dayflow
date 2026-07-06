// Trascrizione server-side opzionale (Whisper). Usata per i file caricati e
// per le note registrate offline (dove la trascrizione live non è disponibile).
// Supporta OpenAI (OPENAI_API_KEY) o Groq (GROQ_API_KEY, whisper-large-v3).

export function isSTTEnabled(): boolean {
  return Boolean(process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY);
}

export async function transcribeAudio(
  audio: Buffer,
  mime: string,
  language = "it",
): Promise<string | null> {
  const groqKey = process.env.GROQ_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!groqKey && !openaiKey) return null;

  const url = groqKey
    ? "https://api.groq.com/openai/v1/audio/transcriptions"
    : "https://api.openai.com/v1/audio/transcriptions";
  const key = groqKey ?? openaiKey!;
  const model = groqKey ? "whisper-large-v3" : "whisper-1";

  const ext = mime.includes("webm")
    ? "webm"
    : mime.includes("ogg")
      ? "ogg"
      : mime.includes("wav")
        ? "wav"
        : mime.includes("mp4") || mime.includes("m4a")
          ? "m4a"
          : "mp3";

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(audio)], { type: mime }), `audio.${ext}`);
  form.append("model", model);
  form.append("language", language);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: form,
    });
    if (!res.ok) {
      console.error("[stt] transcription failed:", res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as { text?: string };
    return data.text?.trim() || null;
  } catch (err) {
    console.error("[stt] transcription error:", err);
    return null;
  }
}
