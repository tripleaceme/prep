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
    /*
      One screen, never more. The page is exactly the height of its container
      and the two columns scroll inside themselves, so reading the tables or
      running a query that returns fifty rows moves nothing on screen — the
      editor stays where you left it and the back link stays reachable.
    */
    <main className="mx-auto flex h-full max-w-[1280px] flex-col px-6 py-6 lg:px-10">
      <Link
        href={`/coding/${group}`}
        className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text)]"
      >
        <ArrowLeft className="size-4" />
        {getGroup(group)?.label ?? "All problems"}
      </Link>

      <div className="mt-4 grid min-h-0 flex-1 gap-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
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
