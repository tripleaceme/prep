"use client";

import { useState } from "react";
import { Lightbulb } from "lucide-react";
import type { Problem } from "@/lib/problems";

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

/** The left-hand column: what you're being asked, and the fixtures if any. */
export function ProblemBrief({ problem }: { problem: Problem }) {
  const [showHint, setShowHint] = useState(false);

  return (
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

      {problem.kind === "dbt" ? (
        <div className="mt-6 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4">
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

      {problem.kind === "sql" || problem.kind === "dbt" ? (
        <details className="mt-6">
          <summary className="cursor-pointer text-sm font-semibold text-[var(--text-faint)] hover:text-[var(--text)]">
            Show the fixture tables
          </summary>
          <pre className="mt-3 overflow-x-auto rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-4 font-mono text-xs leading-relaxed text-[var(--text-muted)]">
            {problem.setup.trim()}
          </pre>
        </details>
      ) : null}
    </section>
  );
}
