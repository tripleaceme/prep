import Link from "next/link";
import { ArrowRight, Clock, Code2, MessageSquare } from "lucide-react";
import { TRACKS } from "@/lib/tracks";

export const metadata = { title: "Mock Interview" };

export default function MockPage() {
  return (
    <main className="mx-auto max-w-[1200px] px-6 py-10 lg:px-10">
      <h1 className="text-[34px] font-bold">Mock Interviews</h1>
      <p className="mt-3 max-w-[70ch] leading-relaxed text-[var(--text-muted)]">
        Practice by the domain you&apos;ll actually be questioned on. Each track
        pushes past definitions — if an answer is generic, you&apos;ll get a
        scenario and be asked what you&apos;d really do.
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
            Use AI Interview instead — paste the job post and practise against
            that exact role.
          </span>
        </span>
        <ArrowRight className="size-5 shrink-0 text-[var(--text-faint)]" />
      </Link>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {TRACKS.map((track) => (
          <div
            key={track.slug}
            className="flex flex-col rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-6"
          >
            <div className="flex items-center gap-4 text-xs text-[var(--text-faint)]">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5" />
                {track.minutes} min
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MessageSquare className="size-3.5" />
                {track.questions} questions
              </span>
            </div>

            <h2 className="mt-4 text-lg font-bold">{track.name}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--text-muted)]">
              {track.blurb}
            </p>

            <ul className="mt-4 flex flex-wrap gap-2">
              {track.topics.map((topic) => (
                <li
                  key={topic}
                  className="rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-xs text-[var(--text-faint)]"
                >
                  {topic}
                </li>
              ))}
            </ul>

            <Link
              href={`/mock/${track.slug}`}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--brand)] px-5 py-3 font-semibold text-white transition-colors hover:bg-[var(--brand-hover)]"
            >
              Start interview
              <ArrowRight className="size-4" />
            </Link>
          </div>
        ))}
      </div>

      <Link
        href="/coding"
        className="mt-6 flex items-center gap-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5 transition-colors hover:bg-[var(--surface-2)]"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-[var(--brand-dim)]">
          <Code2 className="size-5 text-[var(--brand-bright)]" />
        </span>
        <span className="flex-1">
          <span className="block font-semibold">
            Prefer to write SQL than talk?
          </span>
          <span className="mt-0.5 block text-sm text-[var(--text-muted)]">
            Coding Problems run entirely in your browser — no AI key needed.
          </span>
        </span>
        <ArrowRight className="size-5 shrink-0 text-[var(--text-faint)]" />
      </Link>
    </main>
  );
}
