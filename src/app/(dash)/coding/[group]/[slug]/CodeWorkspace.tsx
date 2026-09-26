"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { sql as sqlLang } from "@codemirror/lang-sql";
import { oneDark } from "@codemirror/theme-one-dark";
import { CheckCircle2, Loader2, Play, XCircle } from "lucide-react";
import { resultsMatch, runQuery, type QueryResult } from "@/lib/duckdb";
import { runPython } from "@/lib/pyodide";
import { compileDbt, type Problem } from "@/lib/problems";
import { saveCodingAttempt } from "@/lib/interviewActions";
import { DataTable } from "./DataTable";

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
  | { kind: "wrong"; reason: string; result?: QueryResult }
  | { kind: "correct"; result?: QueryResult; output?: string };

/** SQL, dbt and Python all share this: write code, run it, get a verdict. */
export function CodeWorkspace({
  problem,
}: {
  problem: Extract<Problem, { kind: "sql" | "dbt" | "python" }>;
}) {
  const [code, setCode] = useState(problem.starter);
  const [outcome, setOutcome] = useState<Outcome>({ kind: "idle" });
  const [engineReady, setEngineReady] = useState(false);

  const isPython = problem.kind === "python";

  // Warm the engine in the background. The first load pulls several megabytes
  // of wasm, and doing that on the first Run makes the button feel broken.
  useEffect(() => {
    let cancelled = false;
    const warm = isPython
      ? import("@/lib/pyodide").then((m) => m.getPyodide())
      : import("@/lib/duckdb").then((m) => m.getDatabase());
    warm
      .then(() => {
        if (!cancelled) setEngineReady(true);
      })
      .catch(() => {
        /* surfaced on the first run instead */
      });
    return () => {
      cancelled = true;
    };
  }, [isPython]);

  async function run() {
    if (!code.trim()) return;
    setOutcome({ kind: "running" });

    try {
      if (problem.kind === "python") {
        const result = await runPython(code, problem.tests);
        if (result.ok) {
          setOutcome({ kind: "correct", output: result.output });
          void saveCodingAttempt({
            problem_slug: problem.slug,
            status: "solved",
            code,
          });
        } else {
          setOutcome({
            kind: "wrong",
            reason: result.error ?? "A check failed.",
          });
          void saveCodingAttempt({
            problem_slug: problem.slug,
            status: "attempted",
            code,
          });
        }
        return;
      }

      // dbt models go through the compile step first; plain SQL runs as typed.
      const query = problem.kind === "dbt" ? compileDbt(code) : code;
      const actual = await runQuery(problem.setup, query);
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
            : "That didn't run. Check your syntax.",
      });
    }
  }

  const result =
    outcome.kind === "correct" || outcome.kind === "wrong"
      ? outcome.result
      : undefined;

  return (
    /* Editor and controls are fixed; only the verdict area below scrolls, so
       a long error or a fifty-row result never moves the editor. */
    <section className="flex min-h-0 flex-col">
      <CodeMirror
        value={code}
        height="320px"
        theme={oneDark}
        // Python gets no SQL grammar; plain text beats the wrong highlighting.
        extensions={isPython ? [] : [sqlLang()]}
        onChange={setCode}
        basicSetup={{ lineNumbers: true, foldGutter: false }}
        className="shrink-0 overflow-hidden rounded-[var(--radius)] border border-[var(--border)] text-[13px]"
      />

      <div className="mt-4 flex shrink-0 flex-wrap items-center gap-3">
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
          {engineReady
            ? isPython
              ? "Python ready"
              : "DuckDB ready"
            : isPython
              ? "Loading Python…"
              : "Loading DuckDB…"}
        </span>
      </div>

      <div className="mt-1 min-h-0 flex-1 overflow-y-auto">
      {outcome.kind === "correct" ? (
        <p className="mt-4 flex items-center gap-2.5 rounded-[var(--radius)] border border-[var(--brand)] bg-[var(--brand-dim)] p-4 font-semibold text-[var(--brand-bright)]">
          <CheckCircle2 className="size-5" />
          {isPython ? "All checks passed." : "Correct — that's the right result set."}
        </p>
      ) : null}

      {outcome.kind === "wrong" ? (
        <div className="mt-5 rounded-[var(--radius)] border border-[var(--warn)] bg-[var(--warn-dim)] p-4">
          <p className="flex items-center gap-2.5 font-semibold text-[var(--warn)]">
            <XCircle className="size-5" />
            Not quite
          </p>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-[var(--text-muted)]">
            {outcome.reason}
          </pre>
        </div>
      ) : null}

      {outcome.kind === "error" ? (
        <div className="mt-5 rounded-[var(--radius)] border border-[var(--danger)] bg-[rgba(224,108,96,0.08)] p-4">
          <p className="font-semibold text-[var(--danger)]">
            That didn&apos;t run
          </p>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-[var(--text-muted)]">
            {outcome.message}
          </pre>
        </div>
      ) : null}

      {outcome.kind === "correct" && outcome.output ? (
        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-[var(--text-faint)]">
            PRINTED OUTPUT
          </p>
          <pre className="overflow-x-auto rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4 font-mono text-xs leading-relaxed text-[var(--text-muted)]">
            {outcome.output}
          </pre>
        </div>
      ) : null}

      {result ? (
        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-[var(--text-faint)]">
            YOUR RESULT · {result.rows.length} row
            {result.rows.length === 1 ? "" : "s"}
          </p>
          <DataTable
            columns={result.columns}
            rows={result.rows as (string | number | null)[][]}
          />
        </div>
      ) : null}
      </div>
    </section>
  );
}
