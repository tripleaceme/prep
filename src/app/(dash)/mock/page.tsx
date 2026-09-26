import Link from "next/link";
import { ArrowRight, Code2, MessageSquare } from "lucide-react";
import { TrackCarousel } from "./TrackCarousel";

export const metadata = { title: "Mock Interview" };

export default function MockPage() {
  return (
    <main className="mx-auto max-w-[1200px] px-6 py-10 lg:px-10">
      <h1 className="text-[34px] font-bold">Mock Interviews</h1>
      <p className="mt-3 max-w-[70ch] leading-relaxed text-[var(--text-muted)]">
        Practice by the domain you&apos;ll actually be questioned on.
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
            Interviewing for a specific job?
          </span>
          <span className="mt-0.5 block text-sm text-[var(--text-muted)]">
            Use AI Interview instead.
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
            Prefer to code than talk?
          </span>
          <span className="mt-0.5 block text-sm text-[var(--text-muted)]">
            Coding Problems run entirely in your browser.
          </span>
        </span>
        <ArrowRight className="size-5 shrink-0 text-[var(--text-faint)]" />
      </Link>
    </main>
  );
}
