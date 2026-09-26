"use client";

import { useEffect, useRef, useState } from "react";
import { Mic } from "lucide-react";

/**
 * The hero walkthrough from the original landing page: four numbered steps,
 * an animated mock of each, and a caption. Auto-advances.
 *
 * Rebuilt against the current design tokens rather than copied, since this
 * page uses the app's palette rather than the legacy one. Two behaviours are
 * carried over deliberately:
 *
 *  - Frames are stacked in one grid cell rather than swapped in and out, so
 *    the box is always as tall as its tallest frame and nothing below it
 *    jumps as the steps cycle.
 *  - Autoplay stops for good the moment someone picks a step themselves.
 *    Continuing to rotate under them is the thing that makes carousels
 *    infuriating.
 */

const STEPS = [
  {
    title: "Choose the job",
    desc: "Paste the real job description you're applying for, or create a practice role from a title, company and industry.",
  },
  {
    title: "Configure the interview",
    desc: "Choose business or technical, set the interview level, and pick the tools the role actually uses.",
  },
  {
    title: "Answer out loud",
    desc: "Talk through the questions as you would in the real thing. Prep listens, and judges how you explain and apply what you know.",
  },
  {
    title: "Find your gaps",
    desc: "See where your knowledge is strong, where your explanations need work, and what to review before the real interview.",
  },
];

const ADVANCE_MS = 4200;

/** Staggered entrance, so items in a frame arrive one after another. */
function stagger(index: number): React.CSSProperties {
  return { animationDelay: `${index * 90}ms` };
}

export function HeroWalkthrough() {
  const [step, setStep] = useState(0);
  const pausedRef = useRef(false);

  useEffect(() => {
    if (pausedRef.current) return;
    const id = setInterval(
      () => setStep((s) => (s + 1) % STEPS.length),
      ADVANCE_MS,
    );
    return () => clearInterval(id);
  }, [step]);

  function pick(index: number) {
    pausedRef.current = true;
    setStep(index);
  }

  return (
    <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-6">
      <div role="tablist" aria-label="How Prep works" className="flex gap-2">
        {STEPS.map((s, i) => (
          <button
            key={s.title}
            role="tab"
            aria-selected={i === step}
            aria-label={`${i + 1}. ${s.title}`}
            onClick={() => pick(i)}
            className={[
              "size-9 rounded-full border text-sm font-semibold transition-colors",
              i === step
                ? "border-[var(--brand-bright)] bg-[var(--brand-bright)] text-[#06201d]"
                : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-faint)] hover:text-[var(--text)]",
            ].join(" ")}
          >
            {String(i + 1).padStart(2, "0")}
          </button>
        ))}
      </div>

      {/* Every frame sits in the same grid cell, so the box never resizes. */}
      <div className="mt-5 grid min-h-[200px] items-start rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-6">
        {/* 1 — Choose the job */}
        <Frame active={step === 0}>
          <p className="text-xs text-[var(--text-muted)]">Job description</p>
          <div className="mt-2.5 rounded-[var(--radius-sm)] bg-[var(--surface)] p-4">
            <span className="block h-2 w-[90%] rounded-full bg-[var(--surface-3)]" />
            <span className="mt-2.5 block h-2 w-[70%] rounded-full bg-[var(--surface-3)]" />
            <span className="mt-2.5 flex items-center gap-1">
              <span className="block h-2 w-[55%] rounded-full bg-[var(--surface-3)]" />
              <span className="block h-3.5 w-px animate-pulse bg-[var(--brand-bright)]" />
            </span>
          </div>
          <div className="mt-4 flex gap-2">
            <span className="rounded-full bg-[var(--brand)] px-3 py-1.5 text-xs font-semibold text-white">
              Simulate
            </span>
            <span className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-muted)]">
              Paste your own
            </span>
          </div>
        </Frame>

        {/* 2 — Configure */}
        <Frame active={step === 1}>
          <div className="flex gap-2">
            <span className="flex-1 rounded-[var(--radius-sm)] border border-[var(--border)] py-2.5 text-center text-xs text-[var(--text-muted)]">
              Business
            </span>
            <span className="flex-1 rounded-[var(--radius-sm)] border border-[var(--brand-bright)] bg-[var(--brand-dim)] py-2.5 text-center text-xs font-semibold text-[var(--brand-bright)]">
              Technical
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {["Industry: Fintech", "Level: L1", "dbt", "Snowflake", "Airflow"].map(
              (tag, i) => (
                <span
                  key={tag}
                  style={stagger(i)}
                  className="animate-[fadeUp_.4s_ease_both] rounded-full bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text-muted)]"
                >
                  {tag}
                </span>
              ),
            )}
          </div>
        </Frame>

        {/* 3 — Answer out loud */}
        <Frame active={step === 2}>
          <div className="flex items-center gap-3.5 rounded-[var(--radius-sm)] bg-[var(--surface)] p-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--brand-bright)]">
              <Mic className="size-4 text-[#06201d]" />
            </span>
            <span className="flex items-end gap-1" aria-hidden>
              {[10, 18, 26, 14, 22, 12, 16].map((h, i) => (
                <span
                  key={i}
                  style={{ height: h, animationDelay: `${i * 110}ms` }}
                  className="w-1 animate-pulse rounded-full bg-[var(--brand-bright)]/70"
                />
              ))}
            </span>
          </div>
          <p
            style={stagger(0)}
            className="mt-4 animate-[fadeUp_.4s_ease_both] text-sm text-[var(--text-muted)]"
          >
            <b className="text-[var(--text)]">Interviewer:</b> How would you
            handle late-arriving data?
          </p>
          <p
            style={stagger(1)}
            className="mt-2 animate-[fadeUp_.4s_ease_both] text-sm text-[var(--text-muted)]"
          >
            <b className="text-[var(--text)]">You:</b> I&apos;d add a lookback
            window on the incremental filter and…
          </p>
        </Frame>

        {/* 4 — Find your gaps */}
        <Frame active={step === 3}>
          <div className="flex gap-2">
            {["Surface", "Working", "Strong"].map((tier) => (
              <span
                key={tier}
                className={[
                  "rounded-full px-3 py-1.5 text-xs",
                  tier === "Working"
                    ? "bg-[var(--brand-dim)] font-semibold text-[var(--brand-bright)]"
                    : "bg-[var(--surface)] text-[var(--text-faint)]",
                ].join(" ")}
              >
                {tier}
              </span>
            ))}
          </div>
          <p className="mt-4 text-xs text-[var(--text-muted)]">To review</p>
          {[
            "Incremental strategies for late-arriving data",
            "Trade-offs between merge and insert-overwrite",
          ].map((line, i) => (
            <p
              key={line}
              style={stagger(i)}
              className="mt-2 animate-[fadeUp_.4s_ease_both] border-t border-[var(--border)] pt-2 text-sm text-[var(--text-muted)]"
            >
              {line}
            </p>
          ))}
        </Frame>
      </div>

      <div className="mt-5">
        <h3 className="font-bold">{STEPS[step].title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">
          {STEPS[step].desc}
        </p>
      </div>
    </div>
  );
}

/**
 * `visibility` rather than `display`, so the hidden frames still contribute
 * their height to the grid cell and the box cannot resize between steps.
 */
function Frame({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      aria-hidden={!active}
      className="col-start-1 row-start-1"
      style={{ visibility: active ? "visible" : "hidden" }}
    >
      {children}
    </div>
  );
}
