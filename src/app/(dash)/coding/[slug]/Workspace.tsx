"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { sql } from "@codemirror/lang-sql";
import { oneDark } from "@codemirror/theme-one-dark";
import {
  ArrowLeft,
  CheckCircle2,
  Lightbulb,
  Loader2,
  Play,
  XCircle,
} from "lucide-react";
import { resultsMatch, runQuery, type QueryResult } from "@/lib/duckdb";
import { saveCodingAttempt } from "@/lib/interviewActions";
import type { Problem } from "@/lib/problems";

// CodeMirror touches `document` on import, so it can't be server-rendered.
const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), {
  ssr: false,
  loading: () => (
    <div className="grid h-[320px] place-items-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)]">
      <Loader2 className="size-5 animate-spin text-[var(--brand-bright)]" />
    </div>
  ),
});

type Outcome =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "error"; message: string }
  | { kind: "wrong"; reason: string; result: QueryResult }
  | { kind: "correct"; result: QueryResult };

export function Workspace({ problem }: { problem: Problem }) {
  const [code, setCode] = useState(problem.starter);
  const [outcome, setOutcome] = useState<Outcome>({ kind: "idle" });
  const [showHint, setShowHint] = useState(false);
  const [engineReady, setEngineReady] = useState(false);

  // Warm DuckDB up in the background — the first load pulls several MB of wasm,
  // and doing it on the first Run makes the button feel broken.
  useEffect(() => {
    let cancelled = false;
    import("@/lib/duckdb")
      .then((module) => module.getDatabase())
      .then(() => {
        if (!cancelled) setEngineReady(true);
      })
      .catch(() => {
        /* surfaced on first run instead */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function run() {
    if (!code.trim()) return;
    setOutcome({ kind: "running" });

    try {
      const actual = await runQuery(problem.setup, code);
      const expected = await runQuery(problem.setup, problem.solution);
      const comparison = resultsMatch(expected, actual, problem.orderMatters);

      if (comparison.ok) {
        setOutcome({ kind: "correct", result: actual });
        void saveCodingAttempt({
          problem_slug: problem.slug,
          status: "solved",
          code,
        });
      } else {
        setOutcome({ kind: "wrong", reason: comparison.reason, result: actual });
        void saveCodingAttempt({
          problem_slug: problem.slug,
          status: "attempted",
          code,
        });
      }
    } catch (error) {
      setOutcome({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "That query couldn't run. Check your syntax.",
      });
    }
  }

  const result =
    outcome.kind === "correct" || outcome.kind === "wrong"
      ? outcome.result
      : null;

  return (
    <main className="mx-auto max-w-[1280px] px-6 py-8 lg:px-10">
      <Link
        href="/coding"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text)]"
      >
        <ArrowLeft className="size-4" />
        All problems
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        {/* Brief */}
        <section>
          <h1 className="text-[26px] font-bold leading-tight">{problem.title}</h1>
          <div className="mt-5 space-y-4">
            {problem.prompt.map((paragraph, i) => (
              <p
                key={i}
                className="leading-relaxed text-[var(--text-muted)]"
                dangerouslySetInnerHTML={{ __html: formatPrompt(paragraph) }}
              />
            ))}
          </div>

          {problem.hint ? (
            <div className="mt-6">
              {showHint ? (
                <p className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm leading-relaxed text-[var(--text-muted)]">
                  {problem.hint}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowHint(true)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-faint)] hover:text-[var(--brand-bright)]"
                >
                  <Lightbulb className="size-4" />
                  Show a hint
                </button>
              )}
            </div>
          ) : null}

          <details className="mt-6">
            <summary className="cursor-pointer text-sm font-semibold text-[var(--text-faint)] hover:text-[var(--text)]">
              Show the fixture tables
            </summary>
            <pre className="mt-3 overflow-x-auto rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-4 font-mono text-xs leading-relaxed text-[var(--text-muted)]">
              {problem.setup.trim()}
            </pre>
          </details>
        </section>

        {/* Editor and results */}
        <section>
          <CodeMirror
            value={code}
            height="320px"
            theme={oneDark}
            extensions={[sql()]}
            onChange={setCode}
            basicSetup={{ lineNumbers: true, foldGutter: false }}
            className="overflow-hidden rounded-[var(--radius)] border border-[var(--border)] text-[13px]"
          />

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={run}
              disabled={outcome.kind === "running" || !code.trim()}
              className="inline-flex items-center gap-2 rounded-[var(--radius)] bg-[var(--brand)] px-6 py-3 font-semibold text-white transition-colors hover:bg-[var(--brand-hover)] disabled:opacity-50"
            >
              {outcome.kind === "running" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Play className="size-4 fill-current" />
              )}
              {outcome.kind === "running" ? "Running…" : "Run & check"}
            </button>

            <button
              type="button"
              onClick={() => {
                setCode(problem.starter);
                setOutcome({ kind: "idle" });
              }}
              className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] px-5 py-3 font-semibold transition-colors hover:bg-[var(--surface-3)]"
            >
              Reset
            </button>

            <span className="text-xs text-[var(--text-faint)]">
              {engineReady ? "DuckDB ready" : "Loading DuckDB…"}
            </span>
          </div>

          {outcome.kind === "correct" ? (
            <p className="mt-5 flex items-center gap-2.5 rounded-[var(--radius)] border border-[var(--brand)] bg-[var(--brand-dim)] p-4 font-semibold text-[var(--brand-bright)]">
              <CheckCircle2 className="size-5" />
              Correct — that&apos;s the right result set.
            </p>
          ) : null}

          {outcome.kind === "wrong" ? (
            <div className="mt-5 rounded-[var(--radius)] border border-[var(--warn)] bg-[var(--warn-dim)] p-4">
              <p className="flex items-center gap-2.5 font-semibold text-[var(--warn)]">
                <XCircle className="size-5" />
                Not quite
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                {outcome.reason}
              </p>
            </div>
          ) : null}

          {outcome.kind === "error" ? (
            <div className="mt-5 rounded-[var(--radius)] border border-[var(--danger)] bg-[rgba(224,108,96,0.08)] p-4">
              <p className="font-semibold text-[var(--danger)]">
                That query didn&apos;t run
              </p>
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-[var(--text-muted)]">
                {outcome.message}
              </pre>
            </div>
          ) : null}

          {result ? (
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-[var(--text-faint)]">
                YOUR RESULT · {result.rows.length} row
                {result.rows.length === 1 ? "" : "s"}
              </p>
              <div className="max-h-[340px] overflow-auto rounded-[var(--radius)] border border-[var(--border)]">
                <table className="w-full border-collapse text-sm">
                  <thead className="sticky top-0 bg-[var(--surface-3)]">
                    <tr>
                      {result.columns.map((column) => (
                        <th
                          key={column}
                          className="px-4 py-2.5 text-left font-semibold"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row, i) => (
                      <tr key={i} className="border-t border-[var(--border)]">
                        {row.map((cell, j) => (
                          <td
                            key={j}
                            className="px-4 py-2.5 font-mono text-[13px] text-[var(--text-muted)]"
                          >
                            {cell === null ? (
                              <span className="text-[var(--text-faint)]">
                                NULL
                              </span>
                            ) : (
                              String(cell)
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

/** Renders the `backticked` identifiers in problem prompts as code. */
function formatPrompt(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped.replace(
    /`([^`]+)`/g,
    '<code class="rounded bg-[var(--surface-3)] px-1.5 py-0.5 font-mono text-[13px] text-[var(--text)]">$1</code>',
  );
}
