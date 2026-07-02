// Cattura vocale con Web Speech API (it-IT): trascrizione live con
// interim, riavvio automatico quando il riconoscitore si ferma da solo
// (succede dopo pause di silenzio), stop esplicito dall'utente.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useVoice(onFinal: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognition | null>(null);
  const wantRef = useRef(false); // l'utente vuole ancora ascoltare?
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;

  const supported =
    typeof window !== "undefined" &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  const start = useCallback(() => {
    if (!supported) return;
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition!;
    const rec = new Ctor();
    rec.lang = "it-IT";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) onFinalRef.current(r[0].transcript.trim());
        else interimText += r[0].transcript;
      }
      setInterim(interimText);
    };
    rec.onend = () => {
      setInterim("");
      // Il motore si spegne da solo dopo il silenzio: se l'utente non ha
      // premuto stop, si riparte (la cattura non deve interrompersi da sé).
      if (wantRef.current) {
        try { rec.start(); } catch { setListening(false); wantRef.current = false; }
      } else {
        setListening(false);
      }
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setError("Microfono non consentito: usa il testo.");
        wantRef.current = false;
        setListening(false);
      }
      // 'no-speech' e simili: onend riavvia da solo.
    };
    recRef.current = rec;
    wantRef.current = true;
    setError(null);
    try {
      rec.start();
      setListening(true);
    } catch {
      setError("Impossibile avviare il microfono.");
    }
  }, [supported]);

  const stop = useCallback(() => {
    wantRef.current = false;
    recRef.current?.stop();
    setListening(false);
    setInterim("");
  }, []);

  useEffect(() => () => { wantRef.current = false; recRef.current?.abort(); }, []);

  return { supported, listening, interim, error, start, stop };
}
