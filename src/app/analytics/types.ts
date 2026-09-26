/** The shape the PHP analytics endpoint returns. */
export interface Analytics {
  funnel: {
    registered: number;
    verified: number;
    onboarded: number;
    started: number;
    completed: number;
    repeated: number;
  };
  totals: {
    interviewsStarted: number;
    interviewsCompleted: number;
    problemsAttempted: number;
    problemsSolved: number;
    activeLast7: number;
    activeLast30: number;
    averageScore: number | null;
  };
  signupsByDay: { day: string; count: number }[];
  interviewsByDay: { day: string; started: number; completed: number }[];
  byTrack: { track: string; started: number; completed: number }[];
  byKind: { kind: string; started: number; completed: number }[];
  byProblem: { problem_slug: string; attempts: number; solved: number }[];
  byUnderstanding: { understanding: string; count: number }[];
  recentUsers: {
    email: string;
    display_name: string | null;
    field: string | null;
    created_at: string;
    onboarded: number;
    verified: number;
    current_streak: number;
    readiness: number;
    completed_interviews: number;
  }[];
  generatedAt: string;
}

export type Range = 7 | 30;

/** An ISO date `n` days before today, in UTC to match the API's clock. */
export function daysAgo(n: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - n);
  return date.toISOString().slice(0, 10);
}

/**
 * Keeps only the rows inside the last `days`, filling in the days that have no
 * row at all.
 *
 * The API groups by date, so a day nobody signed up on is simply absent. Left
 * as-is that makes a sparse chart lie: three bars spread across a month read
 * as steady daily activity rather than as three isolated days.
 */
export function densify<T extends { day: string }>(
  rows: T[],
  days: number,
  blank: (day: string) => T,
): T[] {
  const byDay = new Map(rows.map((row) => [row.day.slice(0, 10), row]));
  const out: T[] = [];

  for (let i = days - 1; i >= 0; i -= 1) {
    const day = daysAgo(i);
    out.push(byDay.get(day) ?? blank(day));
  }

  return out;
}

/** Percentage change from `before` to `after`, or null when there is no base. */
export function changePct(after: number, before: number): number | null {
  if (before === 0) return after === 0 ? 0 : null;
  return Math.round(((after - before) / before) * 100);
}

export function rate(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}
