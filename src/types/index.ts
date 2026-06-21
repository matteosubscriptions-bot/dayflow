// Shared domain types used across client and server.

export type CheckInType = "morning" | "midday" | "evening" | "weekly" | "monthly";
export type LiveCheckInType = "morning" | "midday" | "evening";

export type MoodContextLevel = "low" | "normal" | "high";

export interface MoodContext {
  mood: number; // 1-5
  energy: number; // 1-10
}

export interface MoodSelection {
  emoji: string;
  label: string;
  intensity: number; // 1-5
  energy: number; // 1-10
}

export type CheckInInputType =
  | "voice"
  | "mood_picker"
  | "task_list"
  | "habit_checklist"
  | "text";

export interface CheckInStep {
  id: string;
  questionKey: string;
  questionText: string;
  isDynamic: boolean;
  inputType: CheckInInputType;
  isSkippable: boolean;
  moodAdaptation?: {
    low?: Partial<CheckInStep>;
    high?: Partial<CheckInStep>;
  };
}

export interface CheckInEntryData {
  questionKey: string;
  questionText: string;
  isDynamic: boolean;
  value: string;
  skipped?: boolean;
}

export interface CheckInData {
  type: LiveCheckInType;
  entries: CheckInEntryData[];
  mood?: MoodSelection;
  habitLogs?: HabitLog[];
  status?: "completed" | "minimal" | "quick";
}

export interface HabitLog {
  habitId: string;
  name: string;
  done: boolean;
}

export interface AbsenceInfo {
  isAbsent: boolean;
  days: number;
  showWelcomeBack?: boolean;
  allowGoalRedefine?: boolean;
}

export interface WeeklySummary {
  routineCompletionAvg: number;
  moodTrend: "up" | "stable" | "down";
  taskDeferRate: number;
  topStreaks: { habitName: string; days: number }[];
  warnings: { type: string; description: string }[];
}

export interface GoalHierarchy {
  milestones: { title: string; horizon: string; kpi?: string }[];
  monthlyFocus: string[];
  weeklyActions: string[];
  tomorrowTasks: string[];
}

export type QuickCaptureType = "thought" | "task" | "idea" | "note";
