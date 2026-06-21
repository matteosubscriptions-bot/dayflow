import type { CheckInStep, MoodContext } from "@/types";

/**
 * Adapts check-in steps to the detected mood (spec §10).
 * Low mood → everything skippable, softer phrasing, hide stats.
 * High mood → more challenging phrasing.
 */
export function adaptCheckIn(
  steps: CheckInStep[],
  mood: MoodContext,
): CheckInStep[] {
  if (mood.mood <= 2 || mood.energy <= 3) {
    return steps.map((step) => ({
      ...step,
      isSkippable: true,
      questionText: step.moodAdaptation?.low?.questionText ?? step.questionText,
      inputType: step.moodAdaptation?.low?.inputType ?? step.inputType,
    }));
  }
  if (mood.mood >= 4 && mood.energy >= 7) {
    return steps.map((step) => ({
      ...step,
      questionText: step.moodAdaptation?.high?.questionText ?? step.questionText,
      inputType: step.moodAdaptation?.high?.inputType ?? step.inputType,
    }));
  }
  return steps;
}

export function moodContextLevel(mood: MoodContext): "low" | "normal" | "high" {
  if (mood.mood <= 2 || mood.energy <= 3) return "low";
  if (mood.mood >= 4 && mood.energy >= 7) return "high";
  return "normal";
}
