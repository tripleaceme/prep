import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Dumbbell,
  FileText,
  Flame,
  Play,
  TrendingUp,
} from "lucide-react";
import { callApi } from "@/lib/api";
import { readSession } from "@/lib/session";
import { VerifiedNotice } from "@/components/VerifiedNotice";
import { redirect } from "next/navigation";

export const metadata = { title: "Home" };

interface DashboardResponse {
  profile: {
    display_name: string | null;
    readiness: number;
    current_streak: number;
    longest_streak: number;
  } | null;
  activity: { day: string; interviews: number; problems: number }[];
  reports: unknown[];
}

/** "Ayoade Abel Adegbite" → "Ayoade". A greeting uses the name, not the record. */
function firstName(full: string): string {
  return full.trim().split(/\s+/)[0] || full;
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const START_HERE = [
  {
    href: "/cv",
    icon: FileText,
    title: "Revamp my CV",
    body: "Paste the job post and your current CV. Get it rewritten to match the role — in seconds, no templates to wrestle.",
    cta: "Revamp my CV",
    needsKey: true,
  },
  {
    href: "/interview",
    icon: Bot,
    title: "Practice a real interview",
    body: "Type a role, paste a job post, or upload your CV. Answer out loud, then get an honest report on what you actually know.",
    cta: "Start interview",
    needsKey: true,
  },
  {
    href: "/mock",
    icon: Dumbbell,
    title: "Sharpen a specific skill",
    body: "Focused practice by domain — data modelling, orchestration, pipelines, quality, architecture and governance.",
    cta: "Pick a track",
    needsKey: false,
  },
];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string }>;
}) {
  const { verified } = await searchParams;
  const session = await readSession();
  if (!session) redirect("/login");

  let data: DashboardResponse = {
    profile: null,
    activity: [],
    reports: [],
  };

  try {
    data = await callApi<DashboardResponse>("dashboard", {
      userId: session.userId,
    });
  } catch {
    // Render the shell with zeroed progress rather than an error page — the
    // actions below all still work.
  }

  const name = firstName(
    data.profile?.display_name?.trim() || session.email.split("@")[0],
  );
  const streak = data.profile?.current_streak ?? 0;
  const readiness = data.profile?.readiness ?? 0;

  return (
    <main className="mx-auto max-w-[1200px] px-6 py-10 lg:px-10">
      <VerifiedNotice status={verified} />

      <h1 className="text-[34px] font-bold">
        {greeting()},{" "}
        <span className="text-[var(--brand-bright)]">{name}</span>
      </h1>
      <p className="mt-2 text-[var(--text-muted)]">
        Let&apos;s get you ready for your next interview — start below.
      </p>

      <section className="mt-9">
        <p className="mb-4 text-[11px] font-semibold tracking-[0.14em] text-[var(--text-faint)]">
          START HERE
        </p>

        <div className="grid gap-4 lg:grid-cols-3">
          {START_HERE.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                className="group rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-6 transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)]"
              >
                <div className="flex items-start justify-between">
                  <span className="grid size-11 place-items-center rounded-[var(--radius-sm)] bg-[var(--brand-dim)]">
                    <Icon className="size-5 text-[var(--brand-bright)]" />
                  </span>
                  <span
                    className={[
                      "rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide",
                      card.needsKey
                        ? "bg-[var(--warn-dim)] text-[var(--warn)]"
                        : "bg-[var(--brand-dim)] text-[var(--brand-bright)]",
                    ].join(" ")}
                  >
                    {card.needsKey ? "NEEDS AI KEY" : "NO KEY NEEDED"}
                  </span>
                </div>

                <h2 className="mt-5 text-lg font-bold">{card.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                  {card.body}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--brand-bright)]">
                  {card.cta}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <Link
        href="/interview"
        className="mt-5 flex items-center gap-5 rounded-[var(--radius)] border border-[var(--brand)] bg-[var(--brand-dim)] p-6 transition-colors hover:bg-[rgba(12,135,123,0.18)]"
      >
        <span className="grid size-12 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-[rgba(12,135,123,0.25)]">
          <Bot className="size-6 text-[var(--brand-bright)]" />
        </span>
        <span className="flex-1">
          <span className="block text-lg font-bold">
            Run your first AI interview
          </span>
          <span className="mt-1 block text-sm text-[var(--text-muted)]">
            Answer real questions out loud and get a full report with scores and
            honest feedback.
          </span>
        </span>
        <span className="hidden shrink-0 items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--brand)] px-5 py-3 font-semibold text-white sm:inline-flex">
          <Play className="size-4 fill-current" />
          Start now
        </span>
      </Link>

      <section className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-6">
          <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-[var(--text-faint)]">
            <Flame className="size-4 text-[var(--warn)]" />
            STREAK
          </p>
          <p className="mt-3 text-[34px] font-bold leading-none">
            {streak}
            <span className="ml-2 text-base font-medium text-[var(--text-muted)]">
              {streak === 1 ? "day" : "days"}
            </span>
          </p>
        </div>

        <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-6">
          <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-[var(--text-faint)]">
            <TrendingUp className="size-4 text-[var(--brand-bright)]" />
            READINESS
          </p>
          <div className="mt-3 flex items-center gap-4">
            <div
              className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--surface-3)]"
              role="progressbar"
              aria-valuenow={readiness}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Interview readiness"
            >
              <div
                className="h-full rounded-full bg-[var(--brand-bright)] transition-[width]"
                style={{ width: `${readiness}%` }}
              />
            </div>
            <span className="text-lg font-bold">{readiness}%</span>
          </div>
          <p className="mt-3 text-xs text-[var(--text-faint)]">
            Rises as you complete interviews and close the gaps they find.
          </p>
        </div>
      </section>
    </main>
  );
}
