import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { callApi } from "@/lib/api";
import { readSession } from "@/lib/session";
import { CATEGORIES, GROUPS, getGroup, problemsByCategory } from "@/lib/problems";
import {
  CategoryAccordion,
  type AccordionSection,
} from "./CategoryAccordion";

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

  const sections: AccordionSection[] = group.categories
    .map((value) => {
      const category = CATEGORIES.find((c) => c.value === value);
      return {
        value,
        label: category?.label ?? value,
        blurb: category?.blurb,
        problems: problemsByCategory(value).map((problem) => ({
          slug: problem.slug,
          title: problem.title,
          difficulty: problem.difficulty,
          state: status.get(problem.slug),
        })),
      };
    })
    .filter((section) => section.problems.length > 0);

  const total = sections.reduce((n, s) => n + s.problems.length, 0);

  return (
    // One screen tall. The header is fixed and the accordion takes what is
    // left, so adding problems to a category makes its list scroll rather
    // than making the page grow.
    <main className="mx-auto flex h-full max-w-[1000px] flex-col px-6 py-8 lg:px-10">
      <div className="shrink-0">
        <Link
          href="/coding"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          <ArrowLeft className="size-4" />
          All subjects
        </Link>

        <div className="mt-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h1 className="text-[28px] font-bold">{group.label}</h1>
          <p className="text-sm text-[var(--text-faint)]">
            {total} problem{total === 1 ? "" : "s"}
          </p>
        </div>
        <p className="mt-2 max-w-[70ch] leading-relaxed text-[var(--text-muted)]">
          {group.blurb}
        </p>
      </div>

      <div className="mt-6 flex min-h-0 flex-1 flex-col">
        <CategoryAccordion group={group.value} sections={sections} />
      </div>
    </main>
  );
}
