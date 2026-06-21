"use client";

import { useState } from "react";

// Lightweight multi-item capture used for "top 3" style steps.
export function TaskListInput({
  max = 3,
  onConfirm,
  onSkip,
  showSkip,
}: {
  max?: number;
  onConfirm: (items: string[]) => void;
  onSkip?: () => void;
  showSkip?: boolean;
}) {
  const [items, setItems] = useState<string[]>([""]);

  const update = (i: number, value: string) => {
    const next = [...items];
    next[i] = value;
    if (value && i === items.length - 1 && items.length < max) next.push("");
    setItems(next);
  };

  const confirm = () => {
    const clean = items.map((s) => s.trim()).filter(Boolean);
    onConfirm(clean);
  };

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <input
          key={i}
          value={item}
          onChange={(e) => update(i, e.target.value)}
          placeholder={`${i + 1}.`}
          className="w-full rounded-card border border-ink/10 bg-canvas p-3 outline-none focus:border-focus"
        />
      ))}
      <div className="ml-auto flex items-center gap-4">
        {showSkip && onSkip && (
          <button type="button" className="btn-ghost text-sm" onClick={onSkip}>
            Salta
          </button>
        )}
        <button type="button" className="btn-primary" onClick={confirm}>
          Conferma
        </button>
      </div>
    </div>
  );
}
