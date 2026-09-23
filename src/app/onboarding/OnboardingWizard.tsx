"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { OptionRow } from "@/components/OptionRow";
import { PrepMark } from "@/components/PrepMark";
import {
  CAREER_STAGES,
  EMPLOYER_TYPES,
  FIELDS,
  GOALS,
} from "@/lib/tracks";
import { saveOnboarding } from "./actions";

type StepKey = "career_stage" | "employer_type" | "goal" | "field";

const STEPS: {
  key: StepKey;
  title: string;
  sub: string;
  options: readonly { value: string; label: string; hint: string }[];
  grid?: boolean;
}[] = [
  {
    key: "career_stage",
    title: "Where are you in your career?",
    sub: "This helps us tailor your practice to the right level.",
    options: CAREER_STAGES,
  },
  {
    key: "employer_type",
    title: "What kind of employer are you aiming for?",
    sub: "We'll focus your practice on the right interview style.",
    options: EMPLOYER_TYPES,
  },
  {
    key: "goal",
    title: "What's your main goal right now?",
    sub: "We'll personalise your dashboard and recommendations.",
    options: GOALS,
  },
  {
    key: "field",
    title: "Which part of data are you in?",
    sub: "This tailors your tracks and practice problems to your field.",
    options: FIELDS,
    grid: true,
  },
];

export function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<Record<StepKey, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const current = STEPS[step];
  const chosen = answers[current.key];
  const isLast = step === STEPS.length - 1;

  function choose(value: string) {
    setAnswers((a) => ({ ...a, [current.key]: value }));
  }

  function next() {
    if (!chosen) return;
    if (!isLast) {
      setStep((s) => s + 1);
      return;
    }
    startTransition(async () => {
      const result = await saveOnboarding({
        career_stage: answers.career_stage!,
        employer_type: answers.employer_type!,
        goal: answers.goal!,
        field: answers.field!,
      });
      if (result?.error) setError(result.error);
    });
  }

  return (
    <main className="flex min-h-dvh flex-col items-center px-4 py-10">
      <PrepMark className="mb-8" />

      <div className="w-full max-w-[860px] rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-10">
        {/* Segmented progress — one bar per step, matching the reference */}
        <div className="mb-8 grid grid-cols-4 gap-3">
          {STEPS.map((s, i) => (
            <span
              key={s.key}
              className={[
                "h-[3px] rounded-full transition-colors",
                i <= step ? "bg-[var(--brand-bright)]" : "bg-[var(--surface-3)]",
              ].join(" ")}
            />
          ))}
        </div>

        <p className="text-xs font-semibold tracking-[0.14em] text-[var(--text-faint)]">
          STEP {step + 1} OF {STEPS.length}
        </p>
        <h1 className="mt-3 text-[28px] font-bold sm:text-[32px]">
          {current.title}
        </h1>
        <p className="mt-2 text-[var(--text-muted)]">{current.sub}</p>

        <div
          role="radiogroup"
          aria-label={current.title}
          className={[
            "mt-7 gap-3",
            current.grid ? "grid sm:grid-cols-2" : "grid",
          ].join(" ")}
        >
          {current.options.map((o) => (
            <OptionRow
              key={o.value}
              label={o.label}
              hint={o.hint}
              selected={chosen === o.value}
              onSelect={() => choose(o.value)}
              compact={current.grid}
            />
          ))}
        </div>

        {error ? (
          <p className="mt-5 text-sm text-[var(--danger)]">{error}</p>
        ) : null}

        <div className="mt-8 flex items-center gap-3">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="inline-flex items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] px-6 py-3.5 font-semibold text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text)]"
            >
              <ArrowLeft className="size-4" />
              Back
            </button>
          ) : null}

          <button
            type="button"
            onClick={next}
            disabled={!chosen || pending}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-[var(--radius)] bg-[var(--brand)] px-6 py-3.5 font-semibold text-white transition-colors hover:bg-[var(--brand-hover)] disabled:cursor-not-allowed disabled:bg-[var(--surface-3)] disabled:text-[var(--text-faint)]"
          >
            {pending ? "Setting up…" : isLast ? "Let's go" : "Continue"}
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </main>
  );
}
