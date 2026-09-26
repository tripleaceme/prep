"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  BookOpen,
  Filter,
  LayoutDashboard,
  LogOut,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { getTrack } from "@/lib/tracks";
import { getProblem } from "@/lib/problems";
import { DailyBars, Funnel, Panel, RankedBars, StatTile } from "./charts";
import { PeopleTable } from "./PeopleTable";
import { analyticsLogoutAction } from "./actions";
import { changePct, densify, rate, type Analytics, type Range } from "./types";

type View = "overview" | "funnel" | "activity" | "content" | "people";

const VIEWS: {
  value: View;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  caption: string;
}[] = [
  {
    value: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    caption: "Where the product stands today, and the one number to work on.",
  },
  {
    value: "funnel",
    label: "Funnel",
    icon: Filter,
    caption: "Distinct people at each stage, and what it costs to get to the next.",
  },
  {
    value: "activity",
    label: "Activity",
    icon: Activity,
    caption: "Signups and interviews over time.",
  },
  {
    value: "content",
    label: "Content",
    icon: BookOpen,
    caption: "Which tracks and problems people actually pick, and how they do.",
  },
  {
    value: "people",
    label: "People",
    icon: Users,
    caption: "The most recent accounts, and who is worth an email.",
  },
];

const LADDER_ORDER = ["surface", "working", "strong"] as const;
const LADDER_LABELS = {
  surface: "Surface knowledge",
  working: "Working knowledge",
  strong: "Strong understanding",
};

/** A percentage change, coloured by direction and honest when there is no base. */
function Delta({ value, unit = "%" }: { value: number | null; unit?: string }) {
  if (value === null) {
    return <span className="text-[var(--text-faint)]">no prior period</span>;
  }
  if (value === 0) {
    return <span className="text-[var(--text-faint)]">level</span>;
  }

  const up = value > 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      className={
        up ? "inline-flex items-center gap-1 text-[var(--brand-bright)]"
           : "inline-flex items-center gap-1 text-[var(--warn)]"
      }
    >
      <Icon className="size-3.5" />
      {up ? "+" : ""}
      {value}
      {unit}
    </span>
  );
}

export function AnalyticsDashboard({
  data,
  admin,
}: {
  data: Analytics;
  admin: string;
}) {
  const [view, setView] = useState<View>("overview");
  const [range, setRange] = useState<Range>(30);

  const { funnel, totals } = data;

  /**
   * Everything derived, in one place.
   *
   * The API returns raw counts; the judgements are made here because they are
   * presentation, and because a number without its comparison is the thing
   * that made the first version of this page unreadable — 12 signups is good
   * or bad only next to last week's.
   */
  const derived = useMemo(() => {
    const signups = densify(data.signupsByDay, 60, (day) => ({ day, count: 0 }));
    const interviews = densify(data.interviewsByDay, 60, (day) => ({
      day,
      started: 0,
      completed: 0,
    }));

    const sum = (rows: { count?: number; started?: number }[], key: "count" | "started") =>
      rows.reduce((n, row) => n + Number(row[key] ?? 0), 0);

    const recentSignups = signups.slice(-range);
    const priorSignups = signups.slice(-range * 2, -range);
    const recentInterviews = interviews.slice(-range);
    const priorInterviews = interviews.slice(-range * 2, -range);

    // The funnel's worst step. This is the headline the old page made you
    // work out for yourself by comparing six numbers by eye.
    const steps = [
      { label: "Registered", value: funnel.registered },
      { label: "Confirmed their email", value: funnel.verified },
      { label: "Finished onboarding", value: funnel.onboarded },
      { label: "Started an interview", value: funnel.started },
      { label: "Completed one", value: funnel.completed },
      { label: "Came back for a second", value: funnel.repeated },
    ];

    let leak: { from: string; to: string; kept: number; lost: number } | null = null;
    for (let i = 1; i < steps.length; i += 1) {
      const before = steps[i - 1].value;
      const after = steps[i].value;
      if (before === 0) continue;
      const kept = rate(after, before);
      if (!leak || kept < leak.kept) {
        leak = {
          from: steps[i - 1].label,
          to: steps[i].label,
          kept,
          lost: before - after,
        };
      }
    }

    return {
      signups: recentSignups,
      interviews: recentInterviews,
      signupChange: changePct(
        sum(recentSignups, "count"),
        sum(priorSignups, "count"),
      ),
      interviewChange: changePct(
        sum(recentInterviews, "started"),
        sum(priorInterviews, "started"),
      ),
      signupTotal: sum(recentSignups, "count"),
      leak,
      steps,
    };
  }, [data, funnel, range]);

  const completionRate = rate(totals.interviewsCompleted, totals.interviewsStarted);
  const solveRate = rate(totals.problemsSolved, totals.problemsAttempted);
  const activationRate = rate(funnel.completed, funnel.registered);

  const current = VIEWS.find((v) => v.value === view)!;

  return (
    // Fixed frame: the document never scrolls, each view scrolls in its own
    // region. A dashboard you have to scroll to see is a report.
    <div className="flex h-dvh overflow-hidden">
      <aside className="flex w-[232px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)]">
        <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-[var(--border)] px-5">
          <span className="grid size-8 place-items-center rounded-[var(--radius-sm)] bg-[var(--brand-dim)]">
            <BarChart3 className="size-4 text-[var(--brand-bright)]" />
          </span>
          <span className="font-bold">Analytics</span>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {VIEWS.map((item) => {
              const Icon = item.icon;
              const active = view === item.value;
              return (
                <li key={item.value}>
                  <button
                    type="button"
                    onClick={() => setView(item.value)}
                    aria-current={active ? "page" : undefined}
                    className={[
                      "flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-[15px] font-medium transition-colors",
                      active
                        ? "border-l-2 border-[var(--brand-bright)] bg-[var(--surface-2)] text-[var(--text)]"
                        : "text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]",
                    ].join(" ")}
                  >
                    <Icon className="size-[18px]" />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-[var(--border)] p-3">
          <p className="truncate px-3 pb-2 text-xs text-[var(--text-faint)]">
            {admin}
          </p>
          <form action={analyticsLogoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-[15px] font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
            >
              <LogOut className="size-[18px]" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between gap-6 border-b border-[var(--border)] px-6 lg:px-8">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold">{current.label}</h1>
            <p className="truncate text-xs text-[var(--text-muted)]">
              {current.caption}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-4">
            {view === "overview" || view === "activity" ? (
              <div className="flex gap-1 rounded-[var(--radius-sm)] bg-[var(--surface-2)] p-1">
                {([7, 30] as Range[]).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRange(value)}
                    className={[
                      "rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-semibold transition-colors",
                      range === value
                        ? "bg-[var(--surface)] text-[var(--text)]"
                        : "text-[var(--text-muted)] hover:text-[var(--text)]",
                    ].join(" ")}
                  >
                    {value}d
                  </button>
                ))}
              </div>
            ) : null}

            <p className="hidden text-xs text-[var(--text-faint)] sm:block">
              updated{" "}
              {new Date(data.generatedAt).toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-6 lg:p-8">
          {view === "overview" ? (
            <div className="flex flex-col gap-5">
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatTile
                  label="ACCOUNTS"
                  value={funnel.registered.toLocaleString()}
                  sub={`${rate(funnel.verified, funnel.registered)}% confirmed · ${rate(funnel.onboarded, funnel.registered)}% onboarded`}
                />
                <StatTile
                  label={`SIGNUPS · LAST ${range}D`}
                  value={derived.signupTotal.toLocaleString()}
                  sub=""
                />
                <StatTile
                  label="ACTIVE THIS WEEK"
                  value={totals.activeLast7.toLocaleString()}
                  sub={`${totals.activeLast30} in the last 30 days`}
                />
                <StatTile
                  label="AVERAGE SCORE"
                  value={totals.averageScore === null ? "—" : totals.averageScore}
                  sub={
                    totals.averageScore === null
                      ? "no completed interviews yet"
                      : "out of 100, across all reports"
                  }
                />
              </section>

              {/* The deltas ride under the tiles rather than inside them, so
                  the tile stays one number and the comparison stays legible. */}
              <div className="grid gap-4 text-sm sm:grid-cols-2">
                <p className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-5 py-3.5">
                  <span className="text-[var(--text-muted)]">
                    Signups vs the previous {range} days:{" "}
                  </span>
                  <Delta value={derived.signupChange} />
                </p>
                <p className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-5 py-3.5">
                  <span className="text-[var(--text-muted)]">
                    Interviews started vs the previous {range} days:{" "}
                  </span>
                  <Delta value={derived.interviewChange} />
                </p>
              </div>

              {derived.leak ? (
                <section className="rounded-[var(--radius)] border border-[var(--warn)] bg-[var(--warn-dim)] p-5">
                  <p className="text-[11px] font-semibold tracking-[0.14em] text-[var(--warn)]">
                    BIGGEST DROP-OFF
                  </p>
                  <p className="mt-2 text-lg font-bold">
                    {derived.leak.kept}% get from &ldquo;{derived.leak.from}
                    &rdquo; to &ldquo;{derived.leak.to}&rdquo;
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">
                    {derived.leak.lost} {derived.leak.lost === 1 ? "person" : "people"}{" "}
                    stop here — the widest gap in the funnel, and the one place
                    a week of work buys the most.
                  </p>
                </section>
              ) : null}

              <div className="grid gap-5 xl:grid-cols-2">
                <Panel
                  title={`Signups, last ${range} days`}
                  hint="One bar per day, including the days nobody joined."
                >
                  <DailyBars
                    data={derived.signups.map((d) => ({
                      day: d.day,
                      values: [Number(d.count)],
                    }))}
                    series={[{ label: "Signups", color: "var(--viz-1)" }]}
                  />
                </Panel>

                <Panel
                  title="Activation"
                  hint="The three ratios that say whether the product is working, rather than whether people found it."
                >
                  <RankedBars
                    colors={[
                      "var(--viz-ordinal-1)",
                      "var(--viz-ordinal-2)",
                      "var(--viz-ordinal-3)",
                    ]}
                    emptyMessage="Nothing to measure yet."
                    rows={[
                      {
                        label: "Registered → completed an interview",
                        value: activationRate,
                        sub: `${funnel.completed} of ${funnel.registered}`,
                      },
                      {
                        label: "Interviews finished once started",
                        value: completionRate,
                        sub: `${totals.interviewsCompleted} of ${totals.interviewsStarted}`,
                      },
                      {
                        label: "Coding attempts that end in a solve",
                        value: solveRate,
                        sub: `${totals.problemsSolved} of ${totals.problemsAttempted}`,
                      },
                    ]}
                  />
                </Panel>
              </div>
            </div>
          ) : null}

          {view === "funnel" ? (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
              <Panel
                title="Registration to retention"
                hint="Distinct people at each stage. The gap between two steps is where to spend the next week of work."
              >
                <Funnel
                  steps={[
                    { label: "Registered", value: funnel.registered, note: "Created an account" },
                    {
                      label: "Confirmed their email",
                      value: funnel.verified,
                      note: "Clicked the link — we can reach them if they get locked out",
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

              <div className="flex flex-col gap-4">
                <StatTile
                  label="ACTIVATION"
                  value={`${activationRate}%`}
                  sub="registered → completed an interview"
                />
                <StatTile
                  label="RETURN RATE"
                  value={`${rate(funnel.repeated, funnel.completed)}%`}
                  sub="of people who finished one came back for a second"
                />
                <StatTile
                  label="STALLED AT SIGNUP"
                  value={(funnel.registered - funnel.onboarded).toLocaleString()}
                  sub="registered but never finished onboarding"
                />
              </div>
            </div>
          ) : null}

          {view === "activity" ? (
            <div className="flex flex-col gap-5">
              <Panel
                title={`Interviews, last ${range} days`}
                hint="Started against completed. A widening gap means people are abandoning mid-interview."
              >
                <DailyBars
                  data={derived.interviews.map((d) => ({
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
                title={`Signups, last ${range} days`}
                hint="Days with no signups are shown as empty rather than skipped, so the shape is honest."
              >
                <DailyBars
                  data={derived.signups.map((d) => ({
                    day: d.day,
                    values: [Number(d.count)],
                  }))}
                  series={[{ label: "Signups", color: "var(--viz-1)" }]}
                />
              </Panel>
            </div>
          ) : null}

          {view === "content" ? (
            <div className="grid gap-5 xl:grid-cols-2">
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

              <Panel
                title="AI interview or mock?"
                hint="Which half of the product people reach for. Worth knowing before building more of either."
              >
                <RankedBars
                  colors="var(--viz-2)"
                  emptyMessage="No interviews started yet."
                  rows={data.byKind.map((row) => ({
                    label: row.kind === "ai" ? "AI Interview" : "Mock Interview",
                    value: Number(row.started),
                    sub: `${row.completed} completed`,
                  }))}
                />
              </Panel>

              <Panel
                title="How people are scoring"
                hint="One hue, light to dark, because this is a ladder rather than three unrelated categories."
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
                  rows={data.byProblem.slice(0, 8).map((row) => ({
                    label: getProblem(row.problem_slug)?.title ?? row.problem_slug,
                    value: Number(row.attempts),
                    sub: `${row.solved} solved`,
                  }))}
                />
              </Panel>
            </div>
          ) : null}

          {view === "people" ? (
            <div className="flex h-full min-h-0 flex-col">
              <PeopleTable people={data.recentUsers} />
              <p className="mt-4 shrink-0 text-xs leading-relaxed text-[var(--text-faint)]">
                These numbers start at registration. They cannot tell you how
                many people saw the landing page and left without signing up —
                for that, switch on Vercel Analytics in the project settings,
                which needs no code and is free at this scale.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
