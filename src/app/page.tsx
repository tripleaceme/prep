import Link from "next/link";
import { ArrowRight, Check, Mic, Target, ClipboardList } from "lucide-react";
import { PrepMark } from "@/components/PrepMark";
import { TRACKS } from "@/lib/tracks";

const PILLARS = [
  {
    icon: Target,
    title: "Built around the job",
    body: "Paste the job description and practise against the responsibilities, tools and expectations of the role you're targeting.",
  },
  {
    icon: Mic,
    title: "Practice out loud",
    body: "Knowing an answer and being able to explain it clearly under pressure are two different skills. Prep gives you a chance to practise the second one.",
  },
  {
    icon: ClipboardList,
    title: "Find specific gaps",
    body: "Instead of leaving with a vague score, see the concepts you struggled to explain and the areas worth reviewing.",
  },
];

const LADDER = [
  {
    level: "Surface knowledge",
    body: "You recognise the concept, but struggle to explain how or when it is used.",
  },
  {
    level: "Working knowledge",
    body: "You can explain the concept and apply it to a familiar situation.",
  },
  {
    level: "Strong understanding",
    body: "You can explain trade-offs, reason through unfamiliar situations and apply the concept in context.",
  },
];

const STEPS = [
  {
    title: "Get a Gemini API key",
    body: "Use Google's free tier. You control your own usage, and nothing you say reaches our servers.",
  },
  {
    title: "Bring the job",
    body: "Paste the job description you're preparing for, or pick a practice track by data domain.",
  },
  {
    title: "Start talking",
    body: "Answer the interview out loud, exactly as you would on the day.",
  },
  {
    title: "Review your gaps",
    body: "See what you know, what needs work and what to review next.",
  },
];

export default function LandingPage() {
  return (
    <>
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[rgba(10,12,11,0.85)] backdrop-blur">
        <div className="mx-auto flex max-w-[1140px] items-center justify-between px-6 py-4">
          <PrepMark href="/" />
          <Link
            href="/login"
            className="rounded-[var(--radius-sm)] bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-hover)]"
          >
            Start a Mock Interview
          </Link>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-[1140px] px-6 pb-20 pt-20 sm:pt-28">
          <p className="text-sm font-semibold tracking-wide text-[var(--brand-bright)]">
            Free · No credits · Bring your own AI key
          </p>
          <h1 className="mt-5 max-w-[19ch] text-[42px] font-bold leading-[1.08] sm:text-[60px]">
            Practice the interview before it costs you the offer.
          </h1>
          <p className="mt-6 max-w-[62ch] text-lg leading-relaxed text-[var(--text-muted)]">
            A realistic voice interview simulator for data and analytics roles.
            Paste the job description, answer questions out loud, and find out
            what you actually know before the interviewer does.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-[var(--radius)] bg-[var(--brand)] px-7 py-4 font-semibold text-white transition-colors hover:bg-[var(--brand-hover)]"
            >
              Start a Mock Interview
              <ArrowRight className="size-4" />
            </Link>
            <span className="text-sm text-[var(--text-faint)]">
              No card, no credits — you bring your own key.
            </span>
          </div>
        </section>

        {/* Why generic practice isn't enough */}
        <section className="border-y border-[var(--border)] bg-[var(--surface)]">
          <div className="mx-auto max-w-[1140px] px-6 py-20">
            <h2 className="max-w-[24ch] text-[32px] font-bold sm:text-[40px]">
              Generic interview questions aren&apos;t enough.
            </h2>
            <p className="mt-5 max-w-[68ch] leading-relaxed text-[var(--text-muted)]">
              You can ask an AI to interview you. But a generic conversation
              doesn&apos;t know what the role you&apos;re applying for actually
              demands. Prep starts with the job — the role, the industry, the
              interview stage and the tools the position uses.
            </p>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {PILLARS.map((p) => {
                const Icon = p.icon;
                return (
                  <div
                    key={p.title}
                    className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-6"
                  >
                    <span className="grid size-11 place-items-center rounded-[var(--radius-sm)] bg-[var(--brand-dim)]">
                      <Icon className="size-5 text-[var(--brand-bright)]" />
                    </span>
                    <h3 className="mt-5 text-lg font-bold">{p.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                      {p.body}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Tracks — the thing no competitor has */}
        <section className="mx-auto max-w-[1140px] px-6 py-20">
          <h2 className="max-w-[26ch] text-[32px] font-bold sm:text-[40px]">
            Practice what the interviewer will actually test.
          </h2>
          <p className="mt-5 max-w-[68ch] leading-relaxed text-[var(--text-muted)]">
            Data roles aren&apos;t interviewed like software roles. Prep is
            split by the domains you&apos;ll actually be questioned on, and each
            track goes deeper than a definition check.
          </p>

          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {TRACKS.map((track) => (
              <div
                key={track.slug}
                className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-6"
              >
                <h3 className="text-lg font-bold">{track.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                  {track.blurb}
                </p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {track.topics.slice(0, 3).map((topic) => (
                    <li
                      key={topic}
                      className="rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-xs text-[var(--text-faint)]"
                    >
                      {topic}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Understanding ladder */}
        <section className="border-y border-[var(--border)] bg-[var(--surface)]">
          <div className="mx-auto max-w-[1140px] px-6 py-20">
            <h2 className="max-w-[24ch] text-[32px] font-bold sm:text-[40px]">
              Recognition isn&apos;t the same as understanding.
            </h2>
            <p className="mt-5 max-w-[68ch] leading-relaxed text-[var(--text-muted)]">
              Prep looks beyond whether you&apos;ve heard of a concept. The goal
              is to understand how confidently you can explain it and apply it
              in an interview.
            </p>

            <ol className="mt-12 grid gap-4 md:grid-cols-3">
              {LADDER.map((rung, i) => (
                <li
                  key={rung.level}
                  className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-6"
                >
                  <span className="text-sm font-bold text-[var(--brand-bright)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-3 text-lg font-bold">{rung.level}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                    {rung.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-[1140px] px-6 py-20">
          <h2 className="text-[32px] font-bold sm:text-[40px]">
            Your next interview doesn&apos;t have to be your first practice run.
          </h2>

          <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <li key={step.title}>
                <span className="grid size-9 place-items-center rounded-full bg-[var(--brand-dim)] text-sm font-bold text-[var(--brand-bright)]">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>

          <div className="mt-16 rounded-[20px] border border-[var(--brand)] bg-[var(--brand-dim)] p-8 sm:p-12">
            <h2 className="max-w-[20ch] text-[28px] font-bold sm:text-[36px]">
              Free, and it stays free.
            </h2>
            <ul className="mt-6 space-y-2.5">
              {[
                "No credits, no subscription, no card.",
                "Your answers never leave your browser.",
                "Practice tracks and SQL problems need no AI key at all.",
              ].map((line) => (
                <li
                  key={line}
                  className="flex items-start gap-2.5 text-[var(--text-muted)]"
                >
                  <Check className="mt-0.5 size-4 shrink-0 text-[var(--brand-bright)]" />
                  {line}
                </li>
              ))}
            </ul>
            <Link
              href="/login"
              className="mt-8 inline-flex items-center gap-2 rounded-[var(--radius)] bg-[var(--brand)] px-7 py-4 font-semibold text-white transition-colors hover:bg-[var(--brand-hover)]"
            >
              Start a Mock Interview
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border)]">
        <div className="mx-auto flex max-w-[1140px] flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm text-[var(--text-faint)]">
          <PrepMark href="/" />
          <p>A Behind The Data Academy product.</p>
        </div>
      </footer>
    </>
  );
}
