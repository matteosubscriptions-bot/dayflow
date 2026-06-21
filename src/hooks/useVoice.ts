"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UseVoiceOptions {
  language?: string;
  onTranscript?: (text: string) => void;
  onError?: (error: string) => void;
  silenceTimeout?: number; // ms of silence before auto-stop
}

export interface UseVoiceReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

const ERROR_MESSAGES: Record<string, string> = {
  network: "Connessione non disponibile. Scrivi la tua risposta.",
  "not-allowed":
    "Microfono non autorizzato. Abilita nelle impostazioni del browser o scrivi qui.",
  "service-not-allowed":
    "Microfono non autorizzato. Abilita nelle impostazioni del browser o scrivi qui.",
};

/**
 * Wraps the browser Web Speech API with live interim transcription,
 * silence-based auto-stop, and graceful error handling (spec §5).
 */
export function useVoice(options: UseVoiceOptions = {}): UseVoiceReturn {
  const { language = "it-IT", onTranscript, onError, silenceTimeout = 2000 } = options;

  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalRef = useRef("");
  const noSpeechCount = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(Boolean(Ctor));
  }, []);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimer.current) {
      clearTimeout(silenceTimer.current);
      silenceTimer.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    clearSilenceTimer();
    recognitionRef.current?.stop();
  }, [clearSilenceTimer]);

  const armSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    silenceTimer.current = setTimeout(() => stop(), silenceTimeout);
  }, [clearSilenceTimer, silenceTimeout, stop]);

  const start = useCallback(() => {
    if (typeof window === "undefined") return;
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) {
      setIsSupported(false);
      return;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        /* noop */
      }
    }

    setError(null);
    setInterimTranscript("");
    finalRef.current = "";

    const recognition = new Ctor();
    recognition.lang = language;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          finalRef.current = `${finalRef.current} ${text}`.trim();
        } else {
          interim += text;
        }
      }
      setInterimTranscript(interim);
      if (finalRef.current) setTranscript(finalRef.current);
      noSpeechCount.current = 0;
      armSilenceTimer();
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "no-speech") {
        noSpeechCount.current += 1;
        if (noSpeechCount.current >= 3) {
          setError("Non riesco a sentirti. Prova a scrivere la tua risposta.");
          onError?.("no-speech");
          stop();
        }
        return;
      }
      const message = ERROR_MESSAGES[event.error] ?? "Errore vocale. Scrivi la tua risposta.";
      setError(message);
      onError?.(event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      clearSilenceTimer();
      const finalText = finalRef.current.trim();
      if (finalText) {
        setTranscript(finalText);
        setInterimTranscript("");
        onTranscript?.(finalText);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      // start() can throw if called too quickly; ignore.
    }
  }, [language, onTranscript, onError, armSilenceTimer, clearSilenceTimer, stop]);

  const reset = useCallback(() => {
    finalRef.current = "";
    setTranscript("");
    setInterimTranscript("");
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      clearSilenceTimer();
      recognitionRef.current?.abort();
    };
  }, [clearSilenceTimer]);

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    error,
    start,
    stop,
    reset,
  };
}
