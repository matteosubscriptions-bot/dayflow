// Tipi client-side delle entità (specchiano lo schema Prisma; le date
// viaggiano come stringhe ISO nel JSON delle API).

export type CaptureT = {
  id: string;
  raw: string;
  source: string;
  surface?: string | null;
  suggested?: string | null;
  ambiguous: boolean;
  status: string;
  domain?: string | null;
  aiClean?: string | null;
  processedAt?: string | null;
  createdAt: string;
};

export type LinkT = {
  id: string;
  fromType: string;
  fromId: string;
  toType: string;
  toId: string;
  relation: string;
  createdBy: string;
  createdAt: string;
};

export type LifeGoalT = {
  id: string;
  horizon: string;
  area?: string | null;
  title: string;
  whyDeep?: string | null;
  alignment?: number | null;
  isActive: boolean;
  createdAt: string;
};

export type ProjectT = {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  lastProgressAt?: string | null;
  createdAt: string;
};

export type TaskT = {
  id: string;
  projectId?: string | null;
  title: string;
  urgency: number;
  importance: number;
  dueDate?: string | null;
  scheduledDate?: string | null;
  status: string;
  deferredCount: number;
  supportsGoalId?: string | null;
  captureId?: string | null;
  completedAt?: string | null;
  createdAt: string;
};

export type IdeaT = {
  id: string;
  title: string;
  body?: string | null;
  voiceRaw?: string | null;
  maturity: string;
  theme?: string | null;
  captureId?: string | null;
  createdAt: string;
};

export type DialogueTurn = { role: "user" | "assistant"; content: string; local?: boolean };

export type DialogueT = {
  id: string;
  startedAt: string;
  topic?: string | null;
  transcript: DialogueTurn[];
  insight?: string | null;
  distress: boolean;
};

export type MoodT = {
  id: string;
  date: string;
  time: string;
  label?: string | null;
  moodIntensity?: number | null;
  energy?: number | null;
  context?: string | null;
  createdAt: string;
};

export type HabitT = {
  id: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
};

export type HabitLogT = {
  id: string;
  habitId: string;
  date: string;
  done: boolean;
};

export type ProfileTraitT = {
  id: string;
  trait: string;
  evidence?: string | null;
  confidence: number;
  detectedAt: string;
};

export type AppState = {
  captures: CaptureT[];
  links: LinkT[];
  goals: LifeGoalT[];
  projects: ProjectT[];
  tasks: TaskT[];
  ideas: IdeaT[];
  dialogues: DialogueT[];
  moods: MoodT[];
  habits: HabitT[];
  habitLogs: HabitLogT[];
  traits: ProfileTraitT[];
};
