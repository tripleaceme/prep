"use client";

import { useMemo, useState } from "react";
import { Lightbulb } from "lucide-react";
import type { Problem } from "@/lib/problems";
import { parseFixture } from "@/lib/problems/fixtures";

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
        <div key={table.name}>
          <p className="mb-2 font-mono text-sm font-semibold">{table.name}</p>

          <div className="overflow-x-auto rounded-[var(--radius)] border border-[var(--border)]">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-[var(--surface-3)]">
                <tr>
                  {table.columns.map((column) => (
                    <th
                      key={column.name}
                      className="whitespace-nowrap px-3 py-2 text-left align-bottom"
                    >
                      <span className="block font-semibold">{column.name}</span>
                      {/* The type is what tells you whether to expect NULLs,
                          and whether a comparison needs a cast. */}
                      <span className="block text-[11px] font-normal lowercase text-[var(--text-faint)]">
                        {column.type}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, i) => (
                  <tr key={i} className="border-t border-[var(--border)]">
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className="whitespace-nowrap px-3 py-2 font-mono text-[13px] text-[var(--text-muted)]"
                      >
                        {cell === "NULL" ? (
                          <span className="text-[var(--text-faint)]">NULL</span>
                        ) : (
                          cell
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

type Tab = "question" | "tables" | "hint";

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
    ...(hasTables ? [{ value: "tables" as const, label: "Tables" }] : []),
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

        {tab === "hint" && problem.hint ? (
          <p className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm leading-relaxed text-[var(--text-muted)]">
            {problem.hint}
          </p>
        ) : null}
      </div>
    </section>
  );
}
