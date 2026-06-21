"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function GoalDetailControls({
  goalId,
  initialProgress,
  initialStatus,
}: {
  goalId: string;
  initialProgress: number;
  initialStatus: string;
}) {
  const router = useRouter();
  const [progress, setProgress] = useState(initialProgress);
  const [status, setStatus] = useState(initialStatus);
  const [saving, setSaving] = useState(false);

  const save = async (patch: Record<string, unknown>) => {
    setSaving(true);
    await fetch(`/api/goals/${goalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setSaving(false);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4 rounded-card bg-mist p-4">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="meta">Progresso</span>
          <span className="meta">{progress}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={progress}
          onChange={(e) => setProgress(Number(e.target.value))}
          onMouseUp={() => save({ progress })}
          onTouchEnd={() => save({ progress })}
          className="w-full accent-achieved"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { value: "active", label: "Attivo" },
          { value: "achieved", label: "Raggiunto" },
          { value: "paused", label: "In pausa" },
          { value: "dropped", label: "Lasciato" },
        ].map((s) => (
          <button
            key={s.value}
            type="button"
            disabled={saving}
            onClick={() => {
              setStatus(s.value);
              void save({ status: s.value });
            }}
            className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
              status === s.value ? "bg-focus text-white" : "bg-canvas text-ink/60"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
