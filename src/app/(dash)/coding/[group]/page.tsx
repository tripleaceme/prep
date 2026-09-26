import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, Circle, CircleDot } from "lucide-react";
import { callApi } from "@/lib/api";
import { readSession } from "@/lib/session";
import {
  CATEGORIES,
  GROUPS,
  getGroup,
  problemsByCategory,
} from "@/lib/problems";

export function generateStaticParams() {
  return GROUPS.map((group) => ({ group: group.value }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ group: string }>;
}) {
  const { group } = await params;
  return { title: getGroup(group)?.label ?? "Practice" };
}

interface Attempt {
  problem_slug: string;
  status: "attempted" | "solved";
}

const DIFFICULTY_STYLE = {
  easy: "bg-[var(--brand-dim)] text-[var(--brand-bright)]",
  medium: "bg-[var(--warn-dim)] text-[var(--warn)]",
  hard: "bg-[rgba(224,108,96,0.14)] text-[var(--danger)]",
} as const;

export default async function GroupPage({
  params,
}: {
  params: Promise<{ group: string }>;
}) {
  const { group: slug } = await params;
  const group = getGroup(slug);
  if (!group) notFound();

  const session = await readSession();
  if (!session) redirect("/login");

  let attempts: Attempt[] = [];
  try {
    const data = await callApi<{ attempts: Attempt[] }>("coding", {
      userId: session.userId,
    });
    attempts = data.attempts ?? [];
  } catch {
    /* progress markers are optional */
  }
  const status = new Map(attempts.map((a) => [a.problem_slug, a.status]));

  return (
    <main className="mx-auto max-w-[1000px] px-6 py-10 lg:px-10">
      <Link
        href="/coding"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text)]"
      >
        <ArrowLeft className="size-4" />
        All subjects
      </Link>

      <h1 className="mt-6 text-[32px] font-bold">{group.label}</h1>
      <p className="mt-3 max-w-[70ch] leading-relaxed text-[var(--text-muted)]">
        {group.blurb}
      </p>

      <div className="mt-10 space-y-10">
        {group.categories.map((value) => {
          const category = CATEGORIES.find((c) => c.value === value);
          const problems = problemsByCategory(value);
          if (!problems.length) return null;

          return (
            <section key={value}>
              <h2 className="text-lg font-bold">{category?.label ?? value}</h2>
              {category?.blurb ? (
                <p className="mt-1.5 text-sm text-[var(--text-muted)]">
                  {category.blurb}
                </p>
              ) : null}

              <ul className="mt-4 divide-y divide-[var(--border)] overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)]">
                {problems.map((problem) => {
                  const state = status.get(problem.slug);
                  return (
                    <li key={problem.slug}>
                      <Link
                        href={`/coding/${group.value}/${problem.slug}`}
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
