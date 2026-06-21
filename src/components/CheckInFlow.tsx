"use client";

import { useMemo, useState } from "react";
import { VoiceInput } from "@/components/VoiceInput";
import { MoodPicker } from "@/components/MoodPicker";
import { ProgressDots } from "@/components/ProgressDots";
import { TaskListInput } from "@/components/inputs/TaskListInput";
import { HabitChecklist } from "@/components/inputs/HabitChecklist";
import { adaptCheckIn, moodContextLevel } from "@/lib/adaptCheckIn";
import type {
  CheckInStep,
  HabitLog,
  LiveCheckInType,
  MoodSelection,
} from "@/types";

export interface CheckInFlowProps {
  type: LiveCheckInType;
  checkInId: string;
  steps: CheckInStep[];
  habits: { id: string; name: string }[];
  onComplete: (reflectiveMessage: string) => void;
}

export function CheckInFlow({
  type,
  checkInId,
  steps: initialSteps,
  habits,
  onComplete,
}: CheckInFlowProps) {
  const [steps, setSteps] = useState<CheckInStep[]>(initialSteps);
  const [index, setIndex] = useState(0);
  const [skips, setSkips] = useState(0);
  const [mood, setMood] = useState<MoodSelection | null>(null);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [transitionKey, setTransitionKey] = useState(0);

  const step = steps[index];
  const isLow = mood ? moodContextLevel({ mood: mood.intensity, energy: mood.energy }) === "low" : false;

  const advance = () => {
    if (index + 1 >= steps.length) {
      void complete(mood, habitLogs, "completed");
    } else {
      setIndex((i) => i + 1);
      setTransitionKey((k) => k + 1);
    }
  };

  const saveEntry = async (value: string) => {
    if (!step) return;
    try {
      await fetch("/api/checkin/entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkInId,
          questionKey: step.questionKey,
          questionText: step.questionText,
          voiceRaw: value,
          isDynamic: step.isDynamic,
        }),
      });
    } catch {
      // Offline: the entry queues client-side; flow never blocks (spec §13/§15).
    }
  };

  const handleConfirmText = async (value: string) => {
    setSkips(0);
    await saveEntry(value);
    advance();
  };

  const handleMood = (selection: MoodSelection) => {
    setMood(selection);
    setSkips(0);
    // Re-adapt the remaining steps based on the first mood reading.
    const ctx = { mood: selection.intensity, energy: selection.energy };
    setSteps((prev) => [
      ...prev.slice(0, index + 1),
      ...adaptCheckIn(prev.slice(index + 1), ctx),
    ]);
    advance();
  };

  const handleHabits = (logs: HabitLog[]) => {
    setHabitLogs(logs);
    setSkips(0);
    advance();
  };

  const handleSkip = () => {
    const next = skips + 1;
    setSkips(next);
    // 3 consecutive skips in the evening → minimal closing (spec §10).
    if (next >= 3 && type === "evening") {
      void complete(mood, habitLogs, "minimal");
      return;
    }
    advance();
  };

  const complete = async (
    moodData: MoodSelection | null,
    logs: HabitLog[],
    status: "completed" | "minimal",
  ) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkin/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkInId, moodData, habitLogs: logs, status }),
      });
      const data = await res.json().catch(() => ({}));
      onComplete(data.reflectiveMessage ?? "Hai chiuso la giornata. Tanto basta.");
    } catch {
      onComplete("Salvato in locale. Sincronizzo appena torni online.");
    } finally {
      setSubmitting(false);
    }
  };

  const minimalClosing = useMemo(
    () => skips >= 3 && type === "evening",
    [skips, type],
  );

  if (submitting) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <Dots />
        <p className="text-ink/50">Salvo…</p>
      </div>
    );
  }

  if (minimalClosing && !mood) {
    return (
      <div className="flex flex-col items-center gap-8 py-8 text-center">
        <p className="question-title">Serata pesante? Solo una cosa: come ti senti?</p>
        <MoodPicker onSelect={(m) => void complete(m, habitLogs, "minimal")} />
      </div>
    );
  }

  if (!step) return null;

  return (
    <div className="flex flex-col gap-10">
      <ProgressDots total={steps.length} current={index} />

      <div key={transitionKey} className="flex flex-col gap-8 animate-slide-in">
        <h2 className="question-title text-center">{step.questionText}</h2>
        {step.isDynamic && <p className="meta text-center">Domanda di oggi</p>}

        {step.inputType === "mood_picker" && (
          <MoodPicker onSelect={handleMood} />
        )}

        {step.inputType === "voice" && (
          <VoiceInput
            onConfirm={handleConfirmText}
            onSkip={step.isSkippable ? handleSkip : undefined}
            showSkip={step.isSkippable && isLow}
          />
        )}

        {step.inputType === "text" && (
          <VoiceInput
            autoStart={false}
            onConfirm={handleConfirmText}
            onSkip={step.isSkippable ? handleSkip : undefined}
            showSkip={step.isSkippable}
          />
        )}

        {step.inputType === "task_list" && (
          <TaskListInput
            onConfirm={(items) => void handleConfirmText(items.join("\n"))}
            onSkip={step.isSkippable ? handleSkip : undefined}
            showSkip={step.isSkippable}
          />
        )}

        {step.inputType === "habit_checklist" && (
          <HabitChecklist
            habits={habits}
            onConfirm={handleHabits}
            onSkip={step.isSkippable ? handleSkip : undefined}
            showSkip={step.isSkippable}
          />
        )}
      </div>

      {step.isSkippable && step.inputType === "mood_picker" && (
        <button type="button" className="btn-ghost mx-auto text-sm" onClick={handleSkip}>
          Salta
        </button>
      )}
    </div>
  );
}

function Dots() {
  return (
    <div className="flex gap-1.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 animate-pulse rounded-full bg-focus"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}
