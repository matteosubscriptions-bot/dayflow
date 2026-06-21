"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { ReportContent } from "@/lib/reports";

const MOOD_COLORS = ["#C4855A", "#7B9E6B", "#94A8B4"];

// Visual review dashboard (spec §8 — Recharts).
export function ReportDashboard({ content }: { content: ReportContent }) {
  const taskData = [
    { name: "Completati", value: content.taskStats.completed },
    { name: "Rimandati", value: content.taskStats.deferred },
    { name: "Aggiunti", value: Math.max(0, content.taskStats.added - content.taskStats.completed) },
  ];

  // Build a routine x day heatmap matrix.
  const routineNames = Array.from(
    new Set(content.routineHeatmap.map((r) => r.routineName)),
  );
  const days = Array.from(new Set(content.routineHeatmap.map((r) => r.date))).sort();
  const doneSet = new Set(
    content.routineHeatmap.filter((r) => r.done).map((r) => `${r.routineName}|${r.date}`),
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Mood line chart */}
      {content.moodSeries.length > 0 && (
        <div className="rounded-card bg-mist p-4">
          <p className="meta mb-3">Umore ed energia</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={content.moodSeries}>
              <XAxis dataKey="date" tickFormatter={(d) => d.slice(8)} fontSize={11} stroke="#1A1A2E55" />
              <YAxis domain={[0, 10]} fontSize={11} stroke="#1A1A2E55" width={20} />
              <Tooltip />
              <Line type="monotone" dataKey="mood" stroke="#4A7C94" strokeWidth={2} dot={false} name="Umore" />
              <Line type="monotone" dataKey="energy" stroke="#C4855A" strokeWidth={2} dot={false} name="Energia" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Task donut */}
      {content.taskStats.added > 0 && (
        <div className="rounded-card bg-mist p-4">
          <p className="meta mb-3">Task</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={taskData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70}>
                {taskData.map((_, i) => (
                  <Cell key={i} fill={MOOD_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 text-xs text-ink/60">
            {taskData.map((t, i) => (
              <span key={t.name} className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ background: MOOD_COLORS[i] }} />
                {t.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Routine heatmap */}
      {routineNames.length > 0 && (
        <div className="rounded-card bg-mist p-4">
          <p className="meta mb-3">Routine</p>
          <div className="flex flex-col gap-2">
            {routineNames.map((name) => (
              <div key={name} className="flex items-center gap-2">
                <span className="w-24 shrink-0 truncate text-xs">{name}</span>
                <div className="flex gap-1">
                  {days.map((d) => (
                    <span
                      key={d}
                      title={d}
                      className="h-4 w-4 rounded-sm"
                      style={{
                        background: doneSet.has(`${name}|${d}`)
                          ? "var(--color-achieved)"
                          : "var(--color-canvas)",
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Goal progress bars */}
      {content.goalProgress.length > 0 && (
        <div className="rounded-card bg-mist p-4">
          <p className="meta mb-3">Obiettivi</p>
          <div className="flex flex-col gap-3">
            {content.goalProgress.map((g) => (
              <div key={g.title}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="truncate">{g.title}</span>
                  <span className="text-ink/50">{g.progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-canvas">
                  <div
                    className="h-full rounded-full bg-achieved"
                    style={{ width: `${g.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
