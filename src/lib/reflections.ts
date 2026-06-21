// Local library of reflective messages (spec §17 Fase 2.6).
// Three registers: reflection / observation / inspiration. Never motivational.

export type ReflectionCategory = "reflection" | "observation" | "inspiration";
export type ReflectionMood = "low" | "normal" | "high";

interface ReflectionMessage {
  text: string;
  category: ReflectionCategory;
  mood: ReflectionMood[];
}

const LIBRARY: ReflectionMessage[] = [
  { text: "Hai dato un nome a oggi. È già un atto di presenza.", category: "reflection", mood: ["normal", "high"] },
  { text: "Quello che noti, cambia. Quello che ignori, decide.", category: "observation", mood: ["normal", "high"] },
  { text: "Non serve che la giornata sia stata buona per averla guardata.", category: "reflection", mood: ["low", "normal"] },
  { text: "Sei tornato qui. Tanto basta, per ora.", category: "reflection", mood: ["low"] },
  { text: "I giorni storti raccontano spesso più di quelli dritti.", category: "observation", mood: ["low"] },
  { text: "Una cosa fatta vale più di dieci pensate. Ne hai mossa una.", category: "observation", mood: ["normal"] },
  { text: "L'energia che hai oggi non è un caso: da dove arriva?", category: "reflection", mood: ["high"] },
  { text: "Quando va bene, vale la pena chiedersi cosa sta funzionando.", category: "observation", mood: ["high"] },
  { text: "Domani non deve essere migliore. Deve solo arrivare.", category: "inspiration", mood: ["low", "normal"] },
  { text: "C'è una versione di te che si costruisce nei giorni qualunque.", category: "inspiration", mood: ["normal", "high"] },
  { text: "Hai chiuso la giornata invece di lasciarla scappare.", category: "reflection", mood: ["normal", "high"] },
  { text: "Il fatto che sia stato difficile non lo rende meno tuo.", category: "reflection", mood: ["low"] },
];

/** Picks a reflective message matching the current mood register. */
export function pickReflection(mood: ReflectionMood = "normal"): {
  text: string;
  category: ReflectionCategory;
} {
  const pool = LIBRARY.filter((m) => m.mood.includes(mood));
  const chosen = pool[Math.floor(Math.random() * pool.length)] ?? LIBRARY[0];
  return { text: chosen.text, category: chosen.category };
}

export function moodLevelFromMood(mood?: number, energy?: number): ReflectionMood {
  if (mood != null && energy != null) {
    if (mood <= 2 || energy <= 3) return "low";
    if (mood >= 4 && energy >= 7) return "high";
  } else if (mood != null) {
    if (mood <= 2) return "low";
    if (mood >= 4) return "high";
  }
  return "normal";
}
