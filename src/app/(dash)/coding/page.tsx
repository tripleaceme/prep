import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Circle, CircleDot } from "lucide-react";
import { callApi } from "@/lib/api";
import { readSession } from "@/lib/session";
import { CATEGORIES, PROBLEMS, problemsByCategory } from "@/lib/problems";

export const metadata = { title: "Coding Problems" };

interface Attempt {
  problem_slug: string;
  status: "attempted" | "solved";
}

const DIFFICULTY_STYLE = {
  easy: "bg-[var(--brand-dim)] text-[var(--brand-bright)]",
  medium: "bg-[var(--warn-dim)] text-[var(--warn)]",
  hard: "bg-[rgba(224,108,96,0.14)] text-[var(--danger)]",
} as const;

export default async function CodingPage() {
  const session = await readSession();
  if (!session) redirect("/login");

  let attempts: Attempt[] = [];
  try {
    const data = await callApi<{ attempts: Attempt[] }>("coding", {
      userId: session.userId,
    });
    attempts = data.attempts ?? [];
  } catch {
    // Progress markers are a nicety; the problems work regardless.
  }

  const status = new Map(attempts.map((a) => [a.problem_slug, a.status]));
  const solved = attempts.filter((a) => a.status === "solved").length;

  return (
    <main className="mx-auto max-w-[1100px] px-6 py-10 lg:px-10">
      <h1 className="text-[34px] font-bold">Coding Problems</h1>
      <p className="mt-3 max-w-[70ch] leading-relaxed text-[var(--text-muted)]">
        SQL you&apos;d actually be asked to write, plus pipelines producing
        wrong numbers that you have to fix. Everything runs in your browser on
        DuckDB — no AI key, no quota, and it keeps working offline.
      </p>

      <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--surface-2)] px-4 py-2 text-sm">
        <CheckCircle2 className="size-4 text-[var(--brand-bright)]" />
        <span className="font-semibold">{solved}</span>
        <span className="text-[var(--text-muted)]">
          of {PROBLEMS.length} solved
        </span>
      </p>

      <div className="mt-10 space-y-12">
        {CATEGORIES.map((category) => {
          const problems = problemsByCategory(category.value);
          if (!problems.length) return null;

          return (
            <section key={category.value}>
              <h2 className="text-xl font-bold">{category.label}</h2>
              <p className="mt-1.5 text-sm text-[var(--text-muted)]">
                {category.blurb}
              </p>

              <ul className="mt-5 divide-y divide-[var(--border)] overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)]">
                {problems.map((problem) => {
                  const state = status.get(problem.slug);
                  return (
                    <li key={problem.slug}>
                      <Link
                        href={`/coding/${problem.slug}`}
                        className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[var(--surface-2)]"
                      >
                        {state === "solved" ? (
                          <CheckCircle2 className="size-5 shrink-0 text-[var(--brand-bright)]" />
                        ) : state === "attempted" ? (
                          <CircleDot className="size-5 shrink-0 text-[var(--warn)]" />
                        ) : (
                          <Circle className="size-5 shrink-0 text-[var(--text-faint)]" />
                        )}

                        <span className="min-w-0 flex-1 font-medium">
                          {problem.title}
                        </span>

                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold uppercase ${DIFFICULTY_STYLE[problem.difficulty]}`}
                        >
                          {problem.difficulty}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </main>
  );
}
