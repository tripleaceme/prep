import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { callApi } from "@/lib/api";
import { readSession } from "@/lib/session";
import { GROUPS, PROBLEMS, problemsByGroup } from "@/lib/problems";

export const metadata = { title: "Coding Problems" };

interface Attempt {
  problem_slug: string;
  status: "attempted" | "solved";
}

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

  const solved = new Set(
    attempts.filter((a) => a.status === "solved").map((a) => a.problem_slug),
  );

  return (
    <main className="mx-auto flex h-full max-w-[1180px] flex-col px-6 py-8 lg:px-10">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-4">
        <h1 className="text-[28px] font-bold">Practice</h1>

        <p className="inline-flex items-center gap-2 rounded-full bg-[var(--surface-2)] px-4 py-2 text-sm">
          <CheckCircle2 className="size-4 text-[var(--brand-bright)]" />
          <span className="font-semibold">{solved.size}</span>
          <span className="text-[var(--text-muted)]">
            of {PROBLEMS.length} solved
          </span>
        </p>
      </div>

      <p className="mt-2 max-w-[70ch] shrink-0 leading-relaxed text-[var(--text-muted)]">
        Pick a subject, then work through its problems.
      </p>

      {/* Subjects first, problems second: a flat list of everything is a wall
          to scroll rather than something to choose from. Three across so the
          six fit two rows without the page growing. */}
      <div className="mt-6 grid shrink-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {GROUPS.map((group) => {
          const problems = problemsByGroup(group.value);
          const done = problems.filter((p) => solved.has(p.slug)).length;
          const pct = problems.length
            ? Math.round((done / problems.length) * 100)
            : 0;

          return (
            <Link
              key={group.value}
              href={`/coding/${group.value}`}
              className="group flex flex-col rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5 transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)]"
            >
              <div className="flex items-start justify-between gap-4">
                <h2 className="font-bold">{group.label}</h2>
                <span className="shrink-0 text-sm text-[var(--text-faint)]">
                  {problems.length} problems
                </span>
              </div>

              <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--text-muted)]">
                {group.blurb}
              </p>

              <div className="mt-4 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-3)]">
                  <div
                    className="h-full rounded-full bg-[var(--brand-bright)]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="shrink-0 text-xs text-[var(--text-faint)]">
                  {done}/{problems.length}
                </span>
                <ArrowRight className="size-4 shrink-0 text-[var(--text-faint)] transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
