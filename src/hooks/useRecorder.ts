"use client";

// Registrazione vocale: MediaRecorder per l'audio + Web Speech API in
// parallelo per la trascrizione live. Funziona anche offline (solo audio:
// la trascrizione live richiede rete su Chrome; in quel caso la nota viene
// trascritta dal server alla sincronizzazione, se configurato).

import { useCallback, useEffect, useRef, useState } from "react";

export interface RecorderResult {
  audioBlob: Blob | null;
  audioMime: string;
  duration: number; // seconds
  transcript: string;
}

export interface UseRecorderReturn {
  isRecording: boolean;
  seconds: number;
  liveTranscript: string;
  interim: string;
  level: number; // 0..1 input level for the waveform
  error: string | null;
  speechSupported: boolean;
  start: () => Promise<void>;
  stop: () => Promise<RecorderResult | null>;
  cancel: () => void;
}

export function useRecorder(language = "it-IT"): UseRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(false);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number>(0);
  const stopResolverRef = useRef<((r: RecorderResult | null) => void) | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    setSpeechSupported(
      typeof window !== "undefined" &&
        Boolean(window.SpeechRecognition || window.webkitSpeechRecognition),
    );
  }, []);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    cancelAnimationFrame(rafRef.current);
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    setLevel(0);
    setIsRecording(false);
  }, []);

  const startSpeech = useCallback(() => {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = language;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onresult = (event: SpeechRecognitionEvent) => {
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalRef.current = `${finalRef.current} ${result[0].transcript}`.trim();
        } else {
          interimText += result[0].transcript;
        }
      }
      setLiveTranscript(finalRef.current);
      setInterim(interimText);
    };
    rec.onerror = () => {
      /* la registrazione audio continua anche senza speech */
    };
    rec.onend = () => {
      // Il riconoscimento si interrompe da solo dopo lunghi silenzi: riavvialo
      // finché stiamo ancora registrando.
      if (mediaRef.current?.state === "recording") {
        try {
          rec.start();
        } catch {
          /* noop */
        }
      }
    };
    recognitionRef.current = rec;
    try {
      rec.start();
    } catch {
      /* noop */
    }
  }, [language]);

  const start = useCallback(async () => {
    setError(null);
    finalRef.current = "";
    setLiveTranscript("");
    setInterim("");
    chunksRef.current = [];
    cancelledRef.current = false;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError(
        "Microfono non disponibile. Controlla i permessi del browser e riprova.",
      );
      return;
    }
    streamRef.current = stream;

    const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";
    const recorder = mime
      ? new MediaRecorder(stream, { mimeType: mime })
      : new MediaRecorder(stream);
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const resolve = stopResolverRef.current;
      stopResolverRef.current = null;
      const duration = Math.round((Date.now() - startedAtRef.current) / 1000);
      const transcript = `${finalRef.current}`.trim();
      cleanup();
      if (cancelledRef.current) {
        resolve?.(null);
        return;
      }
      const blob = new Blob(chunksRef.current, {
        type: recorder.mimeType || "audio/webm",
      });
      resolve?.({
        audioBlob: blob.size > 0 ? blob : null,
        audioMime: recorder.mimeType || "audio/webm",
        duration,
        transcript,
      });
    };

    // Livello input per la waveform.
    try {
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      audioCtxRef.current = ctx;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (const v of data) sum += Math.abs(v - 128);
        setLevel(Math.min(1, sum / data.length / 40));
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      /* waveform opzionale */
    }

    mediaRef.current = recorder;
    startedAtRef.current = Date.now();
    setSeconds(0);
    timerRef.current = setInterval(
      () => setSeconds(Math.round((Date.now() - startedAtRef.current) / 1000)),
      500,
    );

    recorder.start(1000);
    setIsRecording(true);
    if (navigator.onLine) startSpeech();
  }, [cleanup, startSpeech]);

  const stop = useCallback((): Promise<RecorderResult | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRef.current;
      if (!recorder || recorder.state === "inactive") {
        cleanup();
        resolve(null);
        return;
      }
      stopResolverRef.current = resolve;
      recognitionRef.current?.stop();
      recorder.stop();
    });
  }, [cleanup]);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    const recorder = mediaRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    } else {
      cleanup();
    }
  }, [cleanup]);

  useEffect(() => cleanup, [cleanup]);

  return {
    isRecording,
    seconds,
    liveTranscript,
    interim,
    level,
    error,
    speechSupported,
    start,
    stop,
    cancel,
  };
}
