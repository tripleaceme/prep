"use client";

import { useState } from "react";
import { Check, Eye, RotateCcw } from "lucide-react";
import type { ArchitectureProblem } from "@/lib/problems";
import { saveCodingAttempt } from "@/lib/interviewActions";

/**
 * Design questions, answered in prose.
 *
 * You write first, then reveal. The order matters: seeing a model answer
 * before writing your own teaches you to recognise a good answer, which is not
 * the same skill as producing one under questioning — and recognition is
 * exactly what fails you in an interview.
 *
 * Marking is honest self-assessment rather than automated. There is no single
 * right answer to these, and a checker that pretended otherwise would be
 * teaching the wrong thing.
 */
export function ArchitectureWorkspace({
  problem,
}: {
  problem: ArchitectureProblem;
}) {
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [marked, setMarked] = useState<"solid" | "review" | null>(null);

  const enough = answer.trim().length > 80;

  function mark(verdict: "solid" | "review") {
    setMarked(verdict);
    void saveCodingAttempt({
      problem_slug: problem.slug,
      status: verdict === "solid" ? "solved" : "attempted",
      code: answer,
    });
  }

  return (
    <section>
      <label htmlFor="answer" className="mb-2 block text-sm font-semibold">
        Your answer
      </label>
      <textarea
        id="answer"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        rows={12}
        placeholder="Say it the way you would in the room. What decides it, what you'd trade away, and what would change your mind."
        className="w-full resize-none rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3.5 leading-relaxed outline-none placeholder:text-[var(--text-faint)] focus:border-[var(--brand-bright)]"
      />

      {!revealed ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setRevealed(true)}
            disabled={!enough}
            className="inline-flex items-center gap-2 rounded-[var(--radius)] bg-[var(--brand)] px-6 py-3 font-semibold text-white transition-colors hover:bg-[var(--brand-hover)] disabled:cursor-not-allowed disabled:bg-[var(--surface-3)] disabled:text-[var(--text-faint)]"
          >
            <Eye className="size-4" />
            Compare with a strong answer
          </button>
          <span className="text-xs text-[var(--text-faint)]">
            {enough
              ? "Nothing is sent anywhere — this stays in your browser."
              : "Write your answer first. Reading one before writing teaches recognition, not recall."}
          </span>
        </div>
      ) : null}

      {revealed ? (
        <div className="mt-8 space-y-6">
          <div>
            <h2 className="font-bold">What a strong answer covers</h2>
            <ul className="mt-3 space-y-2">
              {problem.keyPoints.map((point, i) => (
                <li
                  key={i}
                  className="flex gap-3 text-sm leading-relaxed text-[var(--text-muted)]"
                >
                  <Check className="mt-0.5 size-4 shrink-0 text-[var(--brand-bright)]" />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5">
            <h2 className="font-bold">One way to say it</h2>
            <p className="mt-1.5 text-xs text-[var(--text-faint)]">
              Not the answer — an answer. Yours can differ entirely and still be
              stronger.
            </p>
            {problem.modelAnswer.map((paragraph, i) => (
              <p
                key={i}
                className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]"
              >
                {paragraph}
              </p>
            ))}
          </div>

          <div className="rounded-[var(--radius)] border border-[var(--border)] p-5">
            <p className="font-semibold">How did yours do?</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Mark it honestly — nobody sees this but you, and the value is
              entirely in being straight with yourself.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => mark("solid")}
                className={[
                  "rounded-[var(--radius)] px-5 py-2.5 font-semibold transition-colors",
                  marked === "solid"
                    ? "bg-[var(--brand)] text-white"
                    : "border border-[var(--border)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)]",
                ].join(" ")}
              >
                I covered the main points
              </button>
              <button
                type="button"
                onClick={() => mark("review")}
                className={[
                  "rounded-[var(--radius)] px-5 py-2.5 font-semibold transition-colors",
                  marked === "review"
                    ? "bg-[var(--warn)] text-[#2a1e06]"
                    : "border border-[var(--border)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)]",
                ].join(" ")}
              >
                I missed things — revisit this
              </button>
              <button
                type="button"
                onClick={() => {
                  setRevealed(false);
                  setMarked(null);
                }}
                className="inline-flex items-center gap-2 px-2 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                <RotateCcw className="size-4" />
                Try again
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
