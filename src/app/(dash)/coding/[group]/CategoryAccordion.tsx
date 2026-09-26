"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Circle,
  CircleDot,
} from "lucide-react";
import type { Difficulty } from "@/lib/problems";

export interface AccordionProblem {
  slug: string;
  title: string;
  difficulty: Difficulty;
  state?: "attempted" | "solved";
}

export interface AccordionSection {
  value: string;
  label: string;
  blurb?: string;
  problems: AccordionProblem[];
}

const DIFFICULTY_STYLE: Record<Difficulty, string> = {
  easy: "bg-[var(--brand-dim)] text-[var(--brand-bright)]",
  medium: "bg-[var(--warn-dim)] text-[var(--warn)]",
  hard: "bg-[rgba(224,108,96,0.14)] text-[var(--danger)]",
};

/**
 * One category open at a time.
 *
 * Every category expanded at once made a subject like SQL twenty-odd rows
 * long, well past the bottom of the screen. Opening one closes the others, so
 * the height of this component is the height of its longest single category
 * rather than the sum of all of them — and the list itself scrolls inside a
 * fixed region, so even that has a ceiling.
 */
export function CategoryAccordion({
  group,
  sections,
}: {
  group: string;
  sections: AccordionSection[];
}) {
  const [open, setOpen] = useState(sections[0]?.value ?? "");

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {sections.map((section) => {
        const isOpen = section.value === open;
        const solved = section.problems.filter(
          (p) => p.state === "solved",
        ).length;

        return (
          <section
            key={section.value}
            className={[
              "flex flex-col overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)]",
              // Only the open one may take the leftover space; the closed ones
              // stay exactly as tall as their header.
              isOpen ? "min-h-0 flex-1" : "shrink-0",
            ].join(" ")}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? "" : section.value)}
              aria-expanded={isOpen}
              className="flex shrink-0 items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[var(--surface-2)]"
            >
              <span className="min-w-0 flex-1">
                <span className="block font-bold">{section.label}</span>
                {section.blurb ? (
                  <span className="mt-0.5 block truncate text-sm text-[var(--text-muted)]">
                    {section.blurb}
                  </span>
                ) : null}
              </span>

              <span className="shrink-0 text-sm text-[var(--text-faint)]">
                {solved}/{section.problems.length}
              </span>

              <ChevronDown
                className={`size-4 shrink-0 text-[var(--text-faint)] transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isOpen ? (
              <ul className="min-h-0 flex-1 divide-y divide-[var(--border)] overflow-y-auto border-t border-[var(--border)]">
                {section.problems.map((problem) => (
                  <li key={problem.slug}>
                    <Link
                      href={`/coding/${group}/${problem.slug}`}
                      className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-[var(--surface-2)]"
                    >
                      {problem.state === "solved" ? (
                        <CheckCircle2 className="size-5 shrink-0 text-[var(--brand-bright)]" />
                      ) : problem.state === "attempted" ? (
                        <CircleDot className="size-5 shrink-0 text-[var(--warn)]" />
                      ) : (
                        <Circle className="size-5 shrink-0 text-[var(--text-faint)]" />
                      )}

                      <span className="min-w-0 flex-1 truncate font-medium">
                        {problem.title}
                      </span>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold uppercase ${DIFFICULTY_STYLE[problem.difficulty]}`}
                      >
                        {problem.difficulty}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
