import { LogOut } from "lucide-react";
import { callApi } from "@/lib/api";
import { readAdminSession } from "@/lib/adminSession";
import { getTrack } from "@/lib/tracks";
import { getProblem } from "@/lib/problems";
import { AnalyticsLogin } from "./AnalyticsLogin";
import { analyticsLogoutAction } from "./actions";
import { DailyBars, Funnel, Panel, RankedBars, StatTile } from "./charts";

export const metadata = { title: "Analytics", robots: { index: false, follow: false } };

interface Analytics {
  funnel: {
    registered: number;
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
    current_streak: number;
    readiness: number;
    completed_interviews: number;
  }[];
  generatedAt: string;
}

const LADDER_ORDER = ["surface", "working", "strong"] as const;
const LADDER_LABELS = {
  surface: "Surface knowledge",
  working: "Working knowledge",
  strong: "Strong understanding",
};

export default async function AnalyticsPage() {
  const admin = await readAdminSession();
  if (!admin) return <AnalyticsLogin />;

  let data: Analytics | null = null;
  let error: string | null = null;

  try {
    data = await callApi<Analytics>("analytics");
  } catch (err) {
    error = err instanceof Error ? err.message : "Could not load analytics.";
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-[600px] px-6 py-20">
        <h1 className="text-[28px] font-bold">Analytics unavailable</h1>
        <p className="mt-3 leading-relaxed text-[var(--text-muted)]">{error}</p>
        <p className="mt-4 text-sm text-[var(--text-faint)]">
          Run <code className="font-mono">node scripts/check-api.mjs</code> to
          find out which half is broken.
        </p>
      </main>
    );
  }

  const { funnel, totals } = data;
  const completionRate =
    totals.interviewsStarted > 0
      ? Math.round((totals.interviewsCompleted / totals.interviewsStarted) * 100)
      : 0;
  const solveRate =
    totals.problemsAttempted > 0
      ? Math.round((totals.problemsSolved / totals.problemsAttempted) * 100)
      : 0;

  return (
    <main className="mx-auto max-w-[1180px] px-6 py-10 lg:px-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold">Analytics</h1>
          <p className="mt-1.5 text-sm text-[var(--text-muted)]">
            Signed in as {admin.username} · updated{" "}
            {new Date(data.generatedAt).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
        <form action={analyticsLogoutAction}>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-[var(--surface-3)]"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </form>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="ACCOUNTS"
          value={funnel.registered.toLocaleString()}
          sub={`${funnel.onboarded} finished onboarding`}
        />
        <StatTile
          label="ACTIVE THIS WEEK"
          value={totals.activeLast7.toLocaleString()}
          sub={`${totals.activeLast30} in the last 30 days`}
        />
        <StatTile
          label="INTERVIEWS COMPLETED"
          value={totals.interviewsCompleted.toLocaleString()}
          sub={`${completionRate}% of ${totals.interviewsStarted} started`}
        />
        <StatTile
          label="AVERAGE SCORE"
          value={totals.averageScore === null ? "—" : `${totals.averageScore}`}
          sub={
            totals.averageScore === null
              ? "no completed interviews yet"
              : "out of 100, across all reports"
          }
        />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel
          title="The funnel"
          hint="Distinct people at each stage. The gap between two steps is where to spend the next week of work."
        >
          <Funnel
            steps={[
              {
                label: "Registered",
                value: funnel.registered,
                note: "Created an account",
              },
              {
                label: "Finished onboarding",
                value: funnel.onboarded,
                note: "Answered all four setup questions",
              },
              {
                label: "Started an interview",
                value: funnel.started,
                note: "Got as far as the first question",
              },
              {
                label: "Completed one",
                value: funnel.completed,
                note: "Reached a report — the moment the product works",
              },
              {
                label: "Came back for a second",
                value: funnel.repeated,
                note: "The only number that predicts retention",
              },
            ]}
          />
        </Panel>

        <Panel
          title="Signups, last 30 days"
          hint="One bar per day. The peak is labelled; hover any bar for its date and count."
        >
          <DailyBars
            data={data.signupsByDay.map((d) => ({
              day: d.day,
              values: [Number(d.count)],
            }))}
            series={[{ label: "Signups", color: "var(--viz-1)" }]}
          />
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel
          title="Interviews, last 30 days"
          hint="Started against completed. A widening gap means people are abandoning mid-interview."
        >
          <DailyBars
            data={data.interviewsByDay.map((d) => ({
              day: d.day,
              values: [Number(d.started), Number(d.completed)],
            }))}
            series={[
              { label: "Started", color: "var(--viz-2)" },
              { label: "Completed", color: "var(--viz-1)" },
            ]}
          />
        </Panel>

        <Panel
          title="Which tracks people choose"
          hint="Mock interview tracks by sessions started, with how many reached a report."
        >
          <RankedBars
            colors="var(--viz-1)"
            emptyMessage="No mock interviews started yet."
            rows={data.byTrack.map((row) => ({
              label: getTrack(row.track)?.name ?? row.track,
              value: Number(row.started),
              sub: `${row.completed} completed`,
            }))}
          />
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel
          title="How people are scoring"
          hint="One hue, light to dark, because this is a ladder rather than four unrelated categories."
        >
          <RankedBars
            colors={[
              "var(--viz-ordinal-1)",
              "var(--viz-ordinal-2)",
              "var(--viz-ordinal-3)",
            ]}
            emptyMessage="No reports yet."
            rows={LADDER_ORDER.map((level) => ({
              label: LADDER_LABELS[level],
              value: Number(
                data.byUnderstanding.find((u) => u.understanding === level)
                  ?.count ?? 0,
              ),
            }))}
          />
        </Panel>

        <Panel
          title="Where coding problems stop people"
          hint={`${solveRate}% of attempts end in a solve. A problem attempted often and solved rarely is either too hard or badly worded.`}
        >
          <RankedBars
            colors="var(--viz-2)"
            emptyMessage="No problems attempted yet."
            rows={data.byProblem.slice(0, 10).map((row) => ({
              label: getProblem(row.problem_slug)?.title ?? row.problem_slug,
              value: Number(row.attempts),
              sub: `${row.solved} solved`,
            }))}
          />
        </Panel>
      </div>

      <section className="mt-6 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="text-lg font-bold">Recent signups</h2>
        <p className="mt-1.5 text-sm text-[var(--text-muted)]">
          The last 25. Someone who registered and never completed an interview
          is the person worth emailing to ask why.
        </p>

        {data.recentUsers.length === 0 ? (
          <p className="py-10 text-center text-sm text-[var(--text-faint)]">
            No accounts yet.
          </p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-[var(--text-faint)]">
                  <th className="py-2.5 pr-4 font-semibold">Email</th>
                  <th className="py-2.5 pr-4 font-semibold">Field</th>
                  <th className="py-2.5 pr-4 font-semibold">Joined</th>
                  <th className="py-2.5 pr-4 text-right font-semibold">
                    Interviews
                  </th>
                  <th className="py-2.5 pr-4 text-right font-semibold">Streak</th>
                  <th className="py-2.5 text-right font-semibold">Readiness</th>
                </tr>
              </thead>
              <tbody>
                {data.recentUsers.map((user) => (
                  <tr
                    key={user.email}
                    className="border-b border-[var(--border)] last:border-0"
                  >
                    <td className="py-2.5 pr-4">
                      <span className="font-medium">{user.email}</span>
                      {!user.onboarded ? (
                        <span className="ml-2 rounded-full bg-[var(--warn-dim)] px-2 py-0.5 text-[10px] font-bold text-[var(--warn)]">
                          NO ONBOARDING
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2.5 pr-4 text-[var(--text-muted)]">
                      {user.field?.replace(/_/g, " ") ?? "—"}
                    </td>
                    <td className="py-2.5 pr-4 text-[var(--text-muted)]">
                      {new Date(user.created_at).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                      })}
                    </td>
                    <td className="py-2.5 pr-4 text-right font-mono">
                      {user.completed_interviews}
                    </td>
                    <td className="py-2.5 pr-4 text-right font-mono">
                      {user.current_streak}
                    </td>
                    <td className="py-2.5 text-right font-mono">
                      {user.readiness}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="mt-8 text-xs leading-relaxed text-[var(--text-faint)]">
        These numbers start at registration. They cannot tell you how many
        people saw the landing page and left without signing up — for that,
        switch on Vercel Analytics in the project settings, which needs no code
        and is free at this scale.
      </p>
    </main>
  );
}
