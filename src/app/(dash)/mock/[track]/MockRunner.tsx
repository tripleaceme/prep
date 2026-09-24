"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { InterviewRunner } from "@/components/interview/InterviewRunner";
import { startInterview } from "@/lib/interviewActions";
import type { Track } from "@/lib/tracks";

/**
 * A mock track needs no setup screen — the track *is* the configuration — so
 * the session row is created on mount and the runner takes over.
 */
export function MockRunner({ track }: { track: Track }) {
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    startInterview({
      kind: "mock",
      track: track.slug,
      role_title: `${track.name} interview`,
      stage: "technical",
    }).then((outcome) => {
      if (cancelled) return;
      if ("error" in outcome) setError(outcome.error);
      else setInterviewId(outcome.id);
    });

    return () => {
      cancelled = true;
    };
  }, [track.slug, track.name]);

  if (error) {
    return (
      <main className="mx-auto max-w-[620px] px-6 py-20 lg:px-10">
        <h1 className="text-[26px] font-bold">Couldn&apos;t start that track</h1>
        <p className="mt-3 leading-relaxed text-[var(--text-muted)]">{error}</p>
      </main>
    );
  }

  if (!interviewId) {
    return (
      <main className="grid min-h-dvh place-items-center px-6">
        <p className="flex items-center gap-3 text-[var(--text-muted)]">
          <Loader2 className="size-5 animate-spin text-[var(--brand-bright)]" />
          Setting up your {track.name} interview…
        </p>
      </main>
    );
  }

  return (
    <InterviewRunner
      interviewId={interviewId}
      title={track.name}
      maxQuestions={track.questions}
      setup={{ kind: "mock", track: track.slug }}
    />
  );
}
