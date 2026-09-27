import Link from "next/link";
import { T } from "@/components/T";
import { ArrowRight, Code2, MessageSquare } from "lucide-react";
import { TrackCarousel } from "./TrackCarousel";

export const metadata = { title: "Mock Interview" };

export default function MockPage() {
  return (
    <main className="mx-auto max-w-[1200px] px-6 py-10 lg:px-10">
      <h1 className="text-[34px] font-bold"><T>Mock Interviews</T></h1>
      <p className="mt-3 max-w-[70ch] leading-relaxed text-[var(--text-muted)]">
        <T>Practice by the domain you&apos;ll actually be questioned on.</T>
      </p>

      <Link
        href="/interview"
        className="mt-7 flex items-center gap-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5 transition-colors hover:bg-[var(--surface-2)]"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-[var(--brand-dim)]">
          <MessageSquare className="size-5 text-[var(--brand-bright)]" />
        </span>
        <span className="flex-1">
          <span className="block font-semibold">
            <T>Interviewing for a specific job?</T>
          </span>
          <span className="mt-0.5 block text-sm text-[var(--text-muted)]">
            <T>Use AI Interview instead.</T>
          </span>
        </span>
        <ArrowRight className="size-5 shrink-0 text-[var(--text-faint)]" />
      </Link>

      {/* Three tracks to a page, so six is two pages rather than a row that
          runs off the edge. */}
      <TrackCarousel />

      <Link
        href="/coding"
        className="mt-8 flex items-center gap-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5 transition-colors hover:bg-[var(--surface-2)]"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-[var(--brand-dim)]">
          <Code2 className="size-5 text-[var(--brand-bright)]" />
        </span>
        <span className="flex-1">
          <span className="block font-semibold">
            <T>Prefer to code than talk?</T>
          </span>
          <span className="mt-0.5 block text-sm text-[var(--text-muted)]">
            <T>Coding Problems run entirely in your browser.</T>
          </span>
        </span>
        <ArrowRight className="size-5 shrink-0 text-[var(--text-faint)]" />
      </Link>
    </main>
  );
}
