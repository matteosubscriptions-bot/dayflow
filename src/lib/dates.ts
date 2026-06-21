import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";

// All week math uses Monday as the first day (it-IT convention).
export const WEEK_OPTS = { weekStartsOn: 1 as const };

export function dayRange(date: Date) {
  return { gte: startOfDay(date), lte: endOfDay(date) };
}

export function weekRange(date: Date) {
  return {
    gte: startOfWeek(date, WEEK_OPTS),
    lte: endOfWeek(date, WEEK_OPTS),
  };
}

export function monthRange(date: Date) {
  return { gte: startOfMonth(date), lte: endOfMonth(date) };
}

/** Parses a YYYY-MM-DD or ISO string to a Date at local start-of-day. */
export function parseDate(input?: string): Date {
  if (!input) return startOfDay(new Date());
  const d = new Date(input);
  return isNaN(d.getTime()) ? startOfDay(new Date()) : d;
}
