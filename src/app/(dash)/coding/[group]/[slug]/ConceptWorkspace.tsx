"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, KeyRound, Loader2, RotateCcw, Send } from "lucide-react";
import type { ConceptProblem } from "@/lib/problems";
import { callInteractionJson, MissingKeyError } from "@/lib/gemini/client";
import {
  buildConceptEvaluationPrompt,
  type ConceptEvaluation,
} from "@/lib/gemini/prompts";
import { saveCodingAttempt } from "@/lib/interviewActions";

type State =
  | { kind: "writing" }
  | { kind: "marking" }
  | { kind: "marked"; result: ConceptEvaluation }
  | { kind: "needs-key" }
  | { kind: "error"; message: string };

const VERDICT_STYLE = {
  strong: {
    border: "border-[var(--brand)]",
    bg: "bg-[var(--brand-dim)]",
    text: "text-[var(--brand-bright)]",
    label: "Strong answer",
  },
  partial: {
    border: "border-[var(--warn)]",
    bg: "bg-[var(--warn-dim)]",
    text: "text-[var(--warn)]",
    label: "Partly there",
  },
  weak: {
    border: "border-[var(--danger)]",
    bg: "bg-[rgba(224,108,96,0.08)]",
    text: "text-[var(--danger)]",
    label: "Needs work",
  },
} as const;

/**
 * Concept questions, marked by the AI rather than self-assessed.
 *
 * There is no model answer to reveal, deliberately. Marking yourself against
 * written prose measures whether you recognise a good answer, and recognition
 * is not what fails people in a room — producing one under questioning is.
 * Sending the answer to be marked tests the thing that actually gets tested.
 *
 * It also means the library can hold hundreds of these, because a question
 * needs only to be written, not answered.
 */
export function ConceptWorkspace({ problem }: { problem: ConceptProblem }) {
  const [answer, setAnswer] = useState("");
  const [state, setState] = useState<State>({ kind: "writing" });

  const enough = answer.trim().length > 40;

  async function submit() {
    setState({ kind: "marking" });
    try {
      const { data } = await callInteractionJson<ConceptEvaluation>(
        buildConceptEvaluationPrompt(problem.prompt.join(" "), answer.trim()),
      );
      setState({ kind: "marked", result: data });

      void saveCodingAttempt({
        problem_slug: problem.slug,
        // Anything below a strong answer counts as attempted, so the progress
        // marker means "I could say this in an interview" rather than "I typed
        // something here once".
        status: data.verdict === "strong" ? "solved" : "attempted",
        code: answer,
      });
    } catch (err) {
      if (err instanceof MissingKeyError) {
        setState({ kind: "needs-key" });
        return;
      }
      setState({
        kind: "error",
        message:
          err instanceof Error ? err.message : "Could not mark that answer.",
      });
    }
  }

  function retry() {
    setState({ kind: "writing" });
  }

  const marked = state.kind === "marked" ? state.result : null;
  const style = marked ? VERDICT_STYLE[marked.verdict] ?? VERDICT_STYLE.partial : null;

  return (
    <section className="flex min-h-0 flex-col">
      <label htmlFor="answer" className="mb-2 block shrink-0 text-sm font-semibold">
        Your answer
      </label>
      <textarea
        id="answer"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        readOnly={state.kind === "marking"}
        rows={10}
        placeholder="Answer it the way you would out loud. Say what it is, when it applies, and what it costs you."
        className="w-full shrink-0 resize-none rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3.5 leading-relaxed outline-none placeholder:text-[var(--text-faint)] focus:border-[var(--brand-bright)]"
      />

      <div className="mt-4 flex shrink-0 flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void submit()}
          disabled={!enough || state.kind === "marking"}
          className="inline-flex items-center gap-2 rounded-[var(--radius)] bg-[var(--brand)] px-6 py-3 font-semibold text-white transition-colors hover:bg-[var(--brand-hover)] disabled:cursor-not-allowed disabled:bg-[var(--surface-3)] disabled:text-[var(--text-faint)]"
        >
          {state.kind === "marking" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          {state.kind === "marking" ? "Marking…" : "Mark my answer"}
        </button>

        {marked ? (
          <button
            type="button"
            onClick={retry}
            className="inline-flex items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] px-5 py-3 font-semibold transition-colors hover:bg-[var(--surface-3)]"
          >
            <RotateCcw className="size-4" />
            Answer again
          </button>
        ) : null}

        {!enough ? (
          <span className="text-xs text-[var(--text-faint)]">
            Say a little more first.
          </span>
        ) : null}
      </div>

      <div className="mt-5 min-h-0 flex-1 overflow-y-auto">
        {state.kind === "needs-key" ? (
          <div className="rounded-[var(--radius)] border border-[var(--warn)] bg-[var(--warn-dim)] p-5">
            <p className="flex items-center gap-2.5 font-semibold text-[var(--warn)]">
              <KeyRound className="size-5" />
              This one needs your AI key
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
              Concept questions are marked by the AI, so they need a key — the
              coding problems don&apos;t, and still run entirely in your
              browser.
            </p>
            <Link
              href="/settings"
              className="mt-4 inline-flex rounded-[var(--radius)] bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-hover)]"
            >
              Add a key
            </Link>
          </div>
        ) : null}

        {state.kind === "error" ? (
          <div className="rounded-[var(--radius)] border border-[var(--danger)] bg-[rgba(224,108,96,0.08)] p-5">
            <p className="font-semibold text-[var(--danger)]">
              Could not mark that
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
              {state.message}
            </p>
          </div>
        ) : null}

        {marked && style ? (
          <div className="space-y-4">
            <div
              className={`rounded-[var(--radius)] border ${style.border} ${style.bg} p-5`}
            >
              <div className="flex items-center justify-between gap-4">
                <p className={`flex items-center gap-2.5 font-bold ${style.text}`}>
                  <CheckCircle2 className="size-5" />
                  {style.label}
                </p>
                <p className={`text-2xl font-bold ${style.text}`}>
                  {marked.score}
                  <span className="text-sm font-semibold opacity-60">/100</span>
                </p>
              </div>
              {marked.note ? (
                <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
                  {marked.note}
                </p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {marked.covered?.length ? (
                <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4">
                  <p className="text-[11px] font-semibold tracking-[0.14em] text-[var(--text-faint)]">
                    YOU COVERED
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {marked.covered.map((item, i) => (
                      <li
                        key={i}
                        className="text-sm leading-relaxed text-[var(--text-muted)]"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {marked.missed?.length ? (
                <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4">
                  <p className="text-[11px] font-semibold tracking-[0.14em] text-[var(--text-faint)]">
                    A STRONGER ANSWER ADDS
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {marked.missed.map((item, i) => (
                      <li
                        key={i}
                        className="text-sm leading-relaxed text-[var(--text-muted)]"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            {/* The follow-up is the point. Every one of these questions has a
                second question behind it, and that is where interviews are
                actually decided. */}
            {marked.followUp ? (
              <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                <p className="text-[11px] font-semibold tracking-[0.14em] text-[var(--text-faint)]">
                  THEY WOULD ASK YOU NEXT
                </p>
                <p className="mt-2 leading-relaxed">{marked.followUp}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
