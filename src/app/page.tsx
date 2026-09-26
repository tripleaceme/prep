"use client";

import Link from "next/link";
import { ArrowRight, Check, Mic, Target, ClipboardList } from "lucide-react";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { PrepMark } from "@/components/PrepMark";
import { LanguageSelect } from "@/components/LanguageSelect";
import { useT } from "@/lib/i18n/context";
import { HeroWalkthrough } from "@/components/HeroWalkthrough";
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

/** "Don't just get a score" — the outcomes section from the original landing. */
const OUTCOMES = [
  {
    title: "Knowledge gaps",
    body: "Identify concepts you recognise but can't yet explain confidently.",
  },
  {
    title: "Reasoning feedback",
    body: "See how well you apply concepts, explain trade-offs and work through unfamiliar situations.",
  },
  {
    title: "Targeted review",
    body: "Get specific concepts and topics to revisit instead of a generic list of things to study.",
  },
  {
    title: "Another attempt",
    body: "Practise again after you've closed the gaps and see whether your answers have improved.",
  },
];

/**
 * Carried over from the original landing page. Two answers are deliberately
 * NOT verbatim: the old copy said "no account is needed" and that sessions
 * stay in your browser, and neither is true any more. Restoring those as-is
 * would have shipped two false claims.
 */
const FAQ = [
  {
    q: "Is Prep free?",
    a: [
      "Yes. Prep itself is free, with no credits and no subscription. You bring your own Gemini API key, and Google's free tier is enough for practice.",
      "You do need an account, so your reports and progress follow you between devices.",
    ],
  },
  {
    q: "Can I use my own job description?",
    a: [
      "Yes. That's one of the main reasons Prep exists. Paste the job description for the role you're preparing for and Prep uses it to shape the interview around the position.",
      "You can also create a simulated role from a title, company and industry.",
    ],
  },
  {
    q: "Is Prep only for Analytics Engineers?",
    a: [
      "Prep is designed for data and analytics roles, including analytics engineering, data engineering, analytics and business intelligence. The tracks and interview configuration adapt to the role you're preparing for.",
    ],
  },
  {
    q: "What's the difference between the Business and Technical tracks?",
    a: [
      "The Business track focuses on industry context, business judgment and how you apply data to business problems. The Technical track focuses on the technical knowledge and tools the role requires.",
      "Both use industry context, because the way data is used in fintech, FMCG and e-commerce can be very different.",
    ],
  },
  {
    q: "What interview levels can I practise?",
    a: [
      "Every stage of the process, from an initial recruiter screen through to technical and more advanced technical rounds.",
    ],
  },
  {
    q: "What happens to my CV and my answers?",
    a: [
      "Your CV and job descriptions are read in your browser and sent straight to Google using your own key — they never pass through a Prep server.",
      "What we do store is the report at the end of a session, so you can reopen it later. Check Google's current terms before using anything genuinely sensitive.",
    ],
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
  const t = useT();
  const [menuOpen, setMenuOpen] = useState(false);

  const NAV = [
    { href: "#how", label: "How it works" },
    { href: "#tracks", label: "Tracks" },
    { href: "#why", label: "Why Prep" },
    { href: "#faq", label: "FAQ" },
  ];

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[rgba(10,12,11,0.9)] backdrop-blur">
        <div className="mx-auto flex max-w-[1140px] items-center justify-between gap-4 px-6 py-4">
          <PrepMark href="/" />

          <nav className="hidden items-center gap-7 text-sm text-[var(--text-muted)] md:flex">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="transition-colors hover:text-[var(--text)]"
              >
                {t(item.label)}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden md:block">
              <LanguageSelect compact />
            </div>
            <Link
              href="/login"
              className="hidden rounded-[var(--radius-sm)] bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-hover)] sm:inline-flex"
            >
              {t("Start a Mock Interview")}
            </Link>

            {/* Below md the anchors and the language picker move in here,
                rather than simply disappearing as they did before. */}
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="grid size-10 place-items-center rounded-[var(--radius-sm)] border border-[var(--border)] text-[var(--text-muted)] transition-colors hover:text-[var(--text)] md:hidden"
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {menuOpen ? (
          <div className="border-t border-[var(--border)] bg-[var(--surface)] md:hidden">
            <nav className="mx-auto flex max-w-[1140px] flex-col px-6 py-2">
              {NAV.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="border-b border-[var(--border)] py-3.5 text-[var(--text-muted)] transition-colors last:border-0 hover:text-[var(--text)]"
                >
                  {t(item.label)}
                </a>
              ))}
              <div className="flex flex-wrap items-center gap-3 py-4">
                <LanguageSelect />
                <Link
                  href="/login"
                  className="rounded-[var(--radius-sm)] bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white sm:hidden"
                >
                  {t("Start a Mock Interview")}
                </Link>
              </div>
            </nav>
          </div>
        ) : null}
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-[1140px] px-6 pb-20 pt-16 sm:pt-20">
          {/* Copy left, walkthrough right — the original arrangement. Stacks
              below lg so the walkthrough never squeezes on a phone. */}
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_minmax(0,460px)]">
            <div>
              <p className="text-sm font-semibold tracking-wide text-[var(--brand-bright)]">
                Free · No credits · Bring your own AI key
              </p>
              <h1 className="mt-5 max-w-[17ch] text-[42px] font-bold leading-[1.08] sm:text-[56px]">{t("Practice the interview before it costs you the offer.")}</h1>
              <p className="mt-6 max-w-[54ch] text-lg leading-relaxed text-[var(--text-muted)]">{t("A realistic voice interview simulator for data and analytics roles. Paste the job description, answer questions out loud, and find out what you actually know before the interviewer does.")}</p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-[var(--radius)] bg-[var(--brand)] px-7 py-4 font-semibold text-white transition-colors hover:bg-[var(--brand-hover)]"
                >{t("Start a Mock Interview")}<ArrowRight className="size-4" />
                </Link>
                <span className="text-sm text-[var(--text-faint)]">
                  No card, no credits.
                </span>
              </div>
            </div>

            <HeroWalkthrough />
          </div>
        </section>

        {/* Why generic practice isn't enough */}
        <section
          id="why"
          className="scroll-mt-20 border-y border-[var(--border)] bg-[var(--surface)]"
        >
          <div className="mx-auto max-w-[1140px] px-6 py-20">
            <h2 className="max-w-[24ch] text-[32px] font-bold sm:text-[40px]">{t("Generic interview questions aren't enough.")}</h2>
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
                    <h3 className="mt-5 text-lg font-bold">{t(p.title)}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                      {t(p.body)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Tracks — the thing no competitor has */}
        <section id="tracks" className="mx-auto max-w-[1140px] scroll-mt-20 px-6 py-20">
          <h2 className="max-w-[26ch] text-[32px] font-bold sm:text-[40px]">{t("Practice what the interviewer will actually test.")}</h2>
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
                <h3 className="text-lg font-bold">{t(track.name)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                  {t(track.blurb)}
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

        {/* Outcomes */}
        <section
          id="outcomes"
          className="scroll-mt-20 border-y border-[var(--border)] bg-[var(--surface)]"
        >
          <div className="mx-auto max-w-[1140px] px-6 py-20">
            <h2 className="max-w-[24ch] text-[32px] font-bold sm:text-[40px]">{t("Don't just get a score. Know what to work on.")}</h2>
            <p className="mt-5 max-w-[68ch] leading-relaxed text-[var(--text-muted)]">{t("A useful practice session should leave you with a clearer idea of what you know, what you don't, and what to do next.")}</p>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {OUTCOMES.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-6"
                >
                  <h3 className="font-bold">{t(item.title)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                    {t(item.body)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Understanding ladder */}
        <section className="border-y border-[var(--border)] bg-[var(--surface)]">
          <div className="mx-auto max-w-[1140px] px-6 py-20">
            <h2 className="max-w-[24ch] text-[32px] font-bold sm:text-[40px]">{t("Recognition isn't the same as understanding.")}</h2>
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
                  <h3 className="mt-3 text-lg font-bold">{t(rung.level)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                    {t(rung.body)}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-[1140px] scroll-mt-20 px-6 py-20">
          <h2 className="text-[32px] font-bold sm:text-[40px]">{t("Your next interview doesn't have to be your first practice run.")}</h2>

          <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <li key={step.title}>
                <span className="grid size-9 place-items-center rounded-full bg-[var(--brand-dim)] text-sm font-bold text-[var(--brand-bright)]">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-bold">{t(step.title)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                  {t(step.body)}
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

        {/* FAQ */}
        <section
          id="faq"
          className="scroll-mt-20 border-t border-[var(--border)] bg-[var(--surface)]"
        >
          <div className="mx-auto max-w-[820px] px-6 py-20">
            <p className="text-sm font-semibold text-[var(--brand-bright)]">
              FAQ
            </p>
            <h2 className="mt-3 text-[32px] font-bold sm:text-[40px]">{t("Good to know before you start.")}</h2>

            <div className="mt-10 divide-y divide-[var(--border)] border-y border-[var(--border)]">
              {FAQ.map((item, i) => (
                <details key={item.q} className="group py-5" open={i === 0}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                    {t(item.q)}
                    <span
                      aria-hidden
                      className="shrink-0 text-[var(--text-faint)] transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  {item.a.map((paragraph, j) => (
                    <p
                      key={j}
                      className="mt-3 leading-relaxed text-[var(--text-muted)]"
                    >
                      {t(paragraph)}
                    </p>
                  ))}
                </details>
              ))}
            </div>

            <p className="mt-8 text-sm text-[var(--text-faint)]">
              Get a free key at{" "}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[var(--brand-bright)] hover:underline"
              >
                aistudio.google.com/apikey
              </a>
              .
            </p>
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
