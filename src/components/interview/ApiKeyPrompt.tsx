"use client";

import Link from "next/link";
import { KeyRound } from "lucide-react";

/** Shown when an AI feature is opened without a key in place. */
export function ApiKeyPrompt({
  what = "this",
}: {
  what?: string;
}) {
  return (
    <main className="mx-auto max-w-[620px] px-6 py-20 lg:px-10">
      <span className="grid size-12 place-items-center rounded-full bg-[var(--warn-dim)]">
        <KeyRound className="size-6 text-[var(--warn)]" />
      </span>
      <h1 className="mt-6 text-[28px] font-bold">
        You need an AI key for {what}
      </h1>
      <p className="mt-3 leading-relaxed text-[var(--text-muted)]">
        Prep runs interviews straight from your browser using your own Gemini
        key. That&apos;s what keeps it free, and why nothing you say reaches our
        servers. Google&apos;s free tier is enough for practice.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/settings"
          className="rounded-[var(--radius)] bg-[var(--brand)] px-6 py-3.5 font-semibold text-white transition-colors hover:bg-[var(--brand-hover)]"
        >
          Add your key
        </Link>
        <Link
          href="/mock"
          className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] px-6 py-3.5 font-semibold transition-colors hover:bg-[var(--surface-3)]"
        >
          Practise without a key
        </Link>
      </div>
      <p className="mt-6 text-sm text-[var(--text-faint)]">
        Coding Problems need no key at all — they run entirely in your browser.
      </p>
    </main>
  );
}
