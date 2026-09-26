"use client";

import { useEffect, useMemo, useState } from "react";
import { Lightbulb, Loader2 } from "lucide-react";
import type { Problem } from "@/lib/problems";
import { parseFixture } from "@/lib/problems/fixtures";
import { runQuery, type QueryResult } from "@/lib/duckdb";
import { DataTable } from "./DataTable";

/** Renders the `backticked` identifiers in a prompt as inline code. */
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

/**
 * The fixtures, drawn as tables.
 *
 * Previously this showed the CREATE and INSERT statements. That is the least
 * useful form of the same information: you have to read SQL to find out what
 * the data looks like, and a dozen INSERT lines pushed the page past the
 * bottom of the screen.
 */
function FixtureTables({ sql }: { sql: string }) {
  const tables = useMemo(() => parseFixture(sql), [sql]);

  if (!tables.length) {
    return (
      <pre className="overflow-x-auto rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-4 font-mono text-xs leading-relaxed text-[var(--text-muted)]">
        {sql.trim()}
      </pre>
    );
  }

  return (
    <div className="space-y-5">
      {tables.map((table) => (
        <DataTable
          key={table.name}
          caption={table.name}
          columns={table.columns.map((c) => c.name)}
          types={table.columns.map((c) => c.type)}
          rows={table.rows}
        />
      ))}
    </div>
  );
}

/**
 * The rows a correct answer produces.
 *
 * Every established practice platform shows this, and leaving it out was the
 * single biggest gap in these problems: without it you are guessing at the
 * shape of the answer — how many rows, in what order, with what column names
 * — which is guesswork about the question rather than work on the problem.
 *
 * It is computed by running the stored solution in the browser rather than
 * written down beside each problem. Two reasons: there is nothing to keep in
 * sync when a fixture changes, and a hand-written expected output that drifts
 * from the checker is worse than none at all.
 */
function ExpectedOutput({
  setup,
  solution,
}: {
  setup: string;
  solution: string;
}) {
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    runQuery(setup, solution)
      .then((data) => {
        if (!cancelled) setResult(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load it.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [setup, solution]);

  if (error) {
    return (
      <p className="text-sm leading-relaxed text-[var(--danger)]">{error}</p>
    );
  }

  if (!result) {
    return (
      <p className="flex items-center gap-2.5 py-8 text-sm text-[var(--text-faint)]">
        <Loader2 className="size-4 animate-spin" />
        Working out the expected rows…
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm leading-relaxed text-[var(--text-muted)]">
        {result.rows.length} row{result.rows.length === 1 ? "" : "s"}, with
        these exact column names.
      </p>
      <DataTable
        columns={result.columns}
        rows={result.rows as (string | number | null)[][]}
      />
    </div>
  );
}

type Tab = "question" | "tables" | "expected" | "hint";

/**
 * The left-hand column: what you're being asked, and the data you're asked it
 * about.
 *
 * Tabs rather than stacked sections, because only one can be open at a time.
 * Revealing the tables used to add their height to the question's, which grew
 * the column past the screen; here they take the same space instead, so the
 * panel is exactly as tall whichever tab you are on.
 */
export function ProblemBrief({ problem }: { problem: Problem }) {
  const hasTables = problem.kind === "sql" || problem.kind === "dbt";
  const [tab, setTab] = useState<Tab>("question");

  const tabs: { value: Tab; label: string }[] = [
    { value: "question", label: "Question" },
    ...(hasTables
      ? [
          { value: "tables" as const, label: "Tables" },
          { value: "expected" as const, label: "Expected" },
        ]
      : []),
    ...(problem.hint ? [{ value: "hint" as const, label: "Hint" }] : []),
  ];

  return (
    <section className="flex min-h-0 flex-col">
      <h1 className="text-[22px] font-bold leading-tight">{problem.title}</h1>

      <div
        role="tablist"
        aria-label="Problem details"
        className="mt-4 flex shrink-0 gap-1 rounded-[var(--radius)] bg-[var(--surface-2)] p-1"
      >
        {tabs.map((item) => (
          <button
            key={item.value}
            role="tab"
            type="button"
            aria-selected={tab === item.value}
            onClick={() => setTab(item.value)}
            className={[
              "flex-1 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-semibold transition-colors",
              tab === item.value
                ? "bg-[var(--surface)] text-[var(--text)]"
                : "text-[var(--text-muted)] hover:text-[var(--text)]",
            ].join(" ")}
          >
            {item.value === "hint" ? (
              <span className="inline-flex items-center gap-1.5">
                <Lightbulb className="size-3.5" />
                {item.label}
              </span>
            ) : (
              item.label
            )}
          </button>
        ))}
      </div>

      {/* The one scrolling region in this column. Everything above it is
          fixed, so the panel's height never depends on the tab. */}
      <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
        {tab === "question" ? (
          <div className="space-y-3.5">
            {problem.prompt.map((paragraph, i) => (
              <p
                key={i}
                className="leading-relaxed text-[var(--text-muted)]"
                dangerouslySetInnerHTML={{ __html: formatPrompt(paragraph) }}
              />
            ))}

            {problem.kind === "dbt" ? (
              <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4">
                <p className="text-sm font-semibold">Models you can ref()</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {Object.keys(problem.refs).map((name) => (
                    <li
                      key={name}
                      className="rounded-full bg-[var(--surface-2)] px-2.5 py-1 font-mono text-xs text-[var(--text-muted)]"
                    >
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}

        {tab === "tables" && hasTables ? (
          <FixtureTables sql={problem.setup} />
        ) : null}

        {tab === "expected" && hasTables ? (
          <ExpectedOutput
            setup={problem.setup}
            solution={problem.solution}
          />
        ) : null}

        {tab === "hint" && problem.hint ? (
          <p className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm leading-relaxed text-[var(--text-muted)]">
            {problem.hint}
          </p>
        ) : null}
      </div>
    </section>
  );
}
