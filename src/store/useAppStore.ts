// Store client: carica tutto lo stato all'avvio, applica update ottimistici
// e sincronizza con le API. La cattura non fallisce mai: se la rete manca,
// il grezzo finisce in una coda localStorage e viene ri-inviato al ritorno
// online (badge "in attesa di invio").

"use client";

import { create } from "zustand";
import { routeCapture } from "@/lib/router";
import type {
  AppState, CaptureT, TaskT, ProjectT, IdeaT, LifeGoalT, MoodT,
  HabitT, HabitLogT, ProfileTraitT, DialogueTurn, LinkT,
} from "@/types";

const QUEUE_KEY = "os-capture-queue-v1";

type PendingCapture = { raw: string; source: string; surface: string; queuedAt: string };

async function api<T = unknown>(path: string, method = "GET", body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || `HTTP ${res.status}`);
  return res.json();
}

function readQueue(): PendingCapture[] {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]"); } catch { return []; }
}
function writeQueue(q: PendingCapture[]) {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch { /* pieno o assente: pazienza */ }
}

type Store = AppState & {
  loaded: boolean;
  online: boolean;
  pendingQueue: PendingCapture[];
  busyCaptureId: string | null;
  toast: string | null;

  load: () => Promise<void>;
  setOnline: (v: boolean) => void;
  showToast: (msg: string) => void;

  saveCapture: (raw: string, source: string, surface: string) => Promise<void>;
  flushQueue: () => Promise<void>;
  elaborate: (c: CaptureT, domain: string) => Promise<{ openDialogue?: boolean; similar?: { id: string; title: string }[] }>;

  addProject: (name: string) => Promise<void>;
  patchProject: (id: string, patch: Record<string, unknown>) => Promise<void>;
  addTask: (data: Record<string, unknown>) => Promise<void>;
  taskAction: (id: string, action: "done" | "defer" | "reopen") => Promise<void>;
  addIdea: (title: string, body?: string) => Promise<void>;
  patchIdea: (id: string, patch: Record<string, unknown>) => Promise<void>;
  ideaBecomeTask: (idea: IdeaT) => Promise<void>;
  runIdeaAgent: (ideaId: string, agent: string) => Promise<string | null>;
  linkIdeas: (fromId: string, toId: string) => Promise<void>;
  addGoal: (data: Record<string, unknown>) => Promise<void>;
  addMood: (data: Record<string, unknown>) => Promise<void>;
  toggleHabit: (habitId: string, date: string) => Promise<void>;
  addHabit: (name: string) => Promise<void>;
  archiveHabit: (id: string) => Promise<void>;
  addTrait: (trait: string, evidence?: string) => Promise<void>;
  saveDialogue: (transcript: DialogueTurn[], distress: boolean, insight?: string) => Promise<void>;
};

export const useAppStore = create<Store>((set, get) => ({
  captures: [], links: [], goals: [], projects: [], tasks: [], ideas: [],
  dialogues: [], moods: [], habits: [], habitLogs: [], traits: [],
  loaded: false, online: true, pendingQueue: [], busyCaptureId: null, toast: null,

  load: async () => {
    set({ pendingQueue: readQueue() });
    try {
      const state = await api<AppState>("/api/state");
      set({ ...state, loaded: true, online: true });
      await get().flushQueue();
    } catch {
      // Offline all'avvio: l'app parte comunque, con la coda locale visibile.
      set({ loaded: true, online: false });
    }
  },

  setOnline: (v) => {
    set({ online: v });
    if (v) get().flushQueue();
  },

  showToast: (msg) => {
    set({ toast: msg });
    setTimeout(() => set({ toast: null }), 3500);
  },

  // ── Cattura: mai fallire ──────────────────────────────────
  saveCapture: async (raw, source, surface) => {
    try {
      const capture = await api<CaptureT>("/api/captures", "POST", { raw, source, surface });
      set((s) => ({ captures: [capture, ...s.captures] }));
    } catch {
      // Rete assente: il grezzo resta comunque, in coda locale.
      const q = [...readQueue(), { raw, source, surface, queuedAt: new Date().toISOString() }];
      writeQueue(q);
      set({ pendingQueue: q, online: false });
      get().showToast("Sei offline: grezzo salvato in locale, lo invio al ritorno della rete.");
    }
  },

  flushQueue: async () => {
    let q = readQueue();
    if (!q.length) return;
    const remaining: PendingCapture[] = [];
    for (const p of q) {
      try {
        const capture = await api<CaptureT>("/api/captures", "POST", p);
        set((s) => ({ captures: [capture, ...s.captures] }));
      } catch {
        remaining.push(p);
      }
    }
    writeQueue(remaining);
    set({ pendingQueue: remaining, online: remaining.length === 0 ? true : get().online });
    if (q.length && !remaining.length) get().showToast("Coda locale inviata: tutto salvato.");
  },

  elaborate: async (c, domain) => {
    set({ busyCaptureId: c.id });
    try {
      const out = await api<{
        capture: CaptureT; task?: TaskT; idea?: IdeaT;
        similar?: { id: string; title: string }[]; openDialogue?: boolean;
      }>("/api/elaborate", "POST", { captureId: c.id, domain });
      set((s) => ({
        captures: s.captures.map((x) => (x.id === c.id ? out.capture : x)),
        tasks: out.task ? [...s.tasks, out.task] : s.tasks,
        ideas: out.idea ? [out.idea, ...s.ideas] : s.ideas,
      }));
      return { openDialogue: out.openDialogue, similar: out.similar };
    } catch {
      get().showToast("Elaborazione non riuscita (rete o formato). Il grezzo resta in attesa: riprova.");
      return {};
    } finally {
      set({ busyCaptureId: null });
    }
  },

  // ── Officina ──────────────────────────────────────────────
  addProject: async (name) => {
    const p = await api<ProjectT>("/api/projects", "POST", { name });
    set((s) => ({ projects: [...s.projects, p] }));
  },
  patchProject: async (id, patch) => {
    const p = await api<ProjectT>(`/api/projects/${id}`, "PATCH", patch);
    set((s) => ({ projects: s.projects.map((x) => (x.id === id ? p : x)) }));
  },
  addTask: async (data) => {
    const t = await api<TaskT>("/api/tasks", "POST", data);
    set((s) => ({ tasks: [...s.tasks, t] }));
  },
  taskAction: async (id, action) => {
    // Ottimistico: l'interfaccia risponde subito, il server conferma.
    const prev = get().tasks;
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              status: action === "done" ? "done" : action === "reopen" ? "todo" : t.status,
              deferredCount: action === "defer" ? t.deferredCount + 1 : t.deferredCount,
            }
          : t
      ),
    }));
    try {
      const t = await api<TaskT>(`/api/tasks/${id}`, "PATCH", { action });
      set((s) => ({
        tasks: s.tasks.map((x) => (x.id === id ? t : x)),
        projects:
          action === "done" && t.projectId
            ? s.projects.map((p) => (p.id === t.projectId ? { ...p, lastProgressAt: new Date().toISOString() } : p))
            : s.projects,
      }));
    } catch {
      set({ tasks: prev });
      get().showToast("Non sono riuscito a salvare: riprova.");
    }
  },
  addIdea: async (title, body) => {
    const i = await api<IdeaT>("/api/ideas", "POST", { title, body });
    set((s) => ({ ideas: [i, ...s.ideas] }));
  },
  patchIdea: async (id, patch) => {
    const i = await api<IdeaT>(`/api/ideas/${id}`, "PATCH", patch);
    set((s) => ({ ideas: s.ideas.map((x) => (x.id === id ? i : x)) }));
  },
  ideaBecomeTask: async (idea) => {
    const out = await api<{ task: TaskT; link: LinkT }>(`/api/ideas/${idea.id}`, "PATCH", { action: "become-task" });
    set((s) => ({ tasks: [...s.tasks, out.task], links: [out.link, ...s.links] }));
    get().showToast(`«${idea.title}» è ora un task in Officina.`);
  },
  runIdeaAgent: async (ideaId, agent) => {
    try {
      const out = await api<{ idea: IdeaT; output: string }>("/api/idea-agent", "POST", { ideaId, agent });
      set((s) => ({ ideas: s.ideas.map((x) => (x.id === ideaId ? out.idea : x)) }));
      return out.output;
    } catch (e) {
      get().showToast(e instanceof Error ? e.message : "Agente non raggiungibile.");
      return null;
    }
  },
  linkIdeas: async (fromId, toId) => {
    const link = await api<LinkT>("/api/links", "POST", {
      fromType: "idea", fromId, toType: "idea", toId, relation: "similar_to",
    });
    set((s) => ({ links: [link, ...s.links] }));
  },

  // ── Specchio ──────────────────────────────────────────────
  addGoal: async (data) => {
    const g = await api<LifeGoalT>("/api/goals", "POST", data);
    set((s) => ({ goals: [...s.goals, g] }));
  },
  addMood: async (data) => {
    const m = await api<MoodT>("/api/moods", "POST", data);
    set((s) => ({ moods: [m, ...s.moods] }));
  },
  toggleHabit: async (habitId, date) => {
    const log = await api<HabitLogT>("/api/habitlogs", "POST", { habitId, date });
    set((s) => {
      const exists = s.habitLogs.some((l) => l.id === log.id);
      return {
        habitLogs: exists
          ? s.habitLogs.map((l) => (l.id === log.id ? log : l))
          : [log, ...s.habitLogs],
      };
    });
  },
  addHabit: async (name) => {
    const h = await api<HabitT>("/api/habits", "POST", { name });
    set((s) => ({ habits: [...s.habits, h] }));
  },
  archiveHabit: async (id) => {
    const h = await api<HabitT>(`/api/habits/${id}`, "PATCH", { isActive: false });
    set((s) => ({ habits: s.habits.map((x) => (x.id === id ? h : x)) }));
  },
  addTrait: async (trait, evidence) => {
    const t = await api<ProfileTraitT>("/api/traits", "POST", { trait, evidence });
    set((s) => ({ traits: [t, ...s.traits] }));
    get().showToast("Conservato nel profilo.");
  },
  saveDialogue: async (transcript, distress, insight) => {
    try {
      const d = await api<Store["dialogues"][number]>("/api/dialogues", "POST", { transcript, distress, insight });
      set((s) => ({ dialogues: [d, ...s.dialogues] }));
    } catch {
      get().showToast("Dialogo non salvato (rete). Il contenuto resta sullo schermo.");
    }
  },
}));
