const MONTHS_IT = [
  "GEN", "FEB", "MAR", "APR", "MAG", "GIU",
  "LUG", "AGO", "SET", "OTT", "NOV", "DIC",
];

/** "06 LUG" — short date used in the library list. */
export function shortDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return `${String(date.getDate()).padStart(2, "0")} ${MONTHS_IT[date.getMonth()]}`;
}

/** "06 LUG 2026, 09:57" — full date used in the note header. */
export function fullDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${shortDate(date)} ${date.getFullYear()}, ${hh}:${mm}`;
}

/** "0:16" — mm:ss for audio durations. */
export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
