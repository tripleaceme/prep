"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { groupOfCategory, getGroup, type Problem } from "@/lib/problems";
import { ProblemBrief } from "./ProblemBrief";
import { CodeWorkspace } from "./CodeWorkspace";
import { ArchitectureWorkspace } from "./ArchitectureWorkspace";

/** Brief on the left, the right kind of workspace on the right. */
export function Workspace({ problem }: { problem: Problem }) {
  const group = groupOfCategory(problem.category);

  return (
    <main className="mx-auto max-w-[1280px] px-6 py-8 lg:px-10">
      <Link
        href={`/coding/${group}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text)]"
      >
        <ArrowLeft className="size-4" />
        {getGroup(group)?.label ?? "All problems"}
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <ProblemBrief problem={problem} />

        {problem.kind === "architecture" ? (
          <ArchitectureWorkspace problem={problem} />
        ) : (
          <CodeWorkspace problem={problem} />
        )}
      </div>
    </main>
  );
}
