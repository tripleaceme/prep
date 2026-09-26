"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Loader2,
  Mic,
  Search,
  Send,
  Square,
  Volume2,
  PlayCircle,
} from "lucide-react";
import {
  buildReviewInstruction,
  buildSystemInstruction,
  type InterviewSetup,
} from "@/lib/gemini/prompts";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useInterviewSession } from "@/hooks/useInterviewSession";
import { useI18n } from "@/lib/i18n/context";
import { UnderstandingBadge } from "@/components/UnderstandingBadge";
import { ApiKeyPrompt } from "./ApiKeyPrompt";

interface Props {
  interviewId: string;
  setup: Omit<InterviewSetup, "personaName" | "personaRole">;
  title: string;
  maxQuestions?: number;
}

export function InterviewRunner({
  interviewId,
  setup,
  title,
  maxQuestions = 6,
}: Props) {
  const router = useRouter();
  const { locale, lang } = useI18n();

  // Mock tracks never interrupt with feedback between questions. That is what
  // the end-of-session report is for, and being marked after every answer
  // breaks the rhythm the interview is meant to rehearse.
  const timing = "end" as const;

  const fullSetup: InterviewSetup = {
    ...setup,
    personaName: "the interviewer",
    personaRole:
      setup.kind === "mock" ? "Senior Data Engineer" : "Hiring Manager",
    timing,
    lang,
  };

  const [savedReportId, setSavedReportId] = useState<string | null>(null);

  const session = useInterviewSession({
    interviewId,
    systemInstruction: buildSystemInstruction(fullSetup),
    reviewInstruction: buildReviewInstruction(fullSetup),
    questionCount: maxQuestions,
    timing,
    onSaved: setSavedReportId,
  });

  const [answer, setAnswer] = useState("");
  const { supported, listening, transcript, start, stop, reset } =
    useSpeechRecognition(locale);

  const [appliedTranscript, setAppliedTranscript] = useState("");
  if (transcript !== appliedTranscript) {
    setAppliedTranscript(transcript);
    if (transcript) setAnswer(transcript);
  }

  if (session.phase === "needs-key") return <ApiKeyPrompt />;

  function send() {
    const text = answer.trim();
    if (!text) return;
    stop();
    setAnswer("");
    reset();
    void session.submitAnswer(text);
  }

  const report = session.report;

  return (
    <main className="mx-auto flex min-h-dvh max-w-[820px] flex-col px-6 py-8 lg:px-10">
      <header className="flex items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold tracking-[0.14em] text-[var(--text-faint)]">
            {title.toUpperCase()}
          </p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {session.persona}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <span className="text-sm text-[var(--text-muted)]">
            {session.phase === "planning"
              ? `${session.questionCount} questions`
              : `Question ${session.questionNumber} of ${session.questionCount}`}
          </span>
          {!report ? (
            <button
              type="button"
              onClick={session.endEarly}
              disabled={session.phase === "reviewing" || session.turns.length < 2}
              className="rounded-[var(--radius-sm)] border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)] disabled:opacity-40"
            >
              End &amp; review
            </button>
          ) : null}
        </div>
      </header>

      <div className="mt-1 h-[3px] w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
        <div
          className="h-full rounded-full bg-[var(--brand-bright)] transition-[width] duration-500"
          style={{
            width: `${(session.questionNumber / Math.max(session.questionCount, 1)) * 100}%`,
          }}
        />
      </div>

      <section className="flex flex-1 flex-col justify-center py-10">
        {session.phase === "planning" ? (
          <p className="flex items-center gap-3 text-lg text-[var(--text-muted)]">
            <Loader2 className="size-5 animate-spin text-[var(--brand-bright)]" />
            Preparing your questions…
          </p>
        ) : null}

        {session.phase === "reviewing" && !report ? (
          <p className="flex items-center gap-3 text-lg text-[var(--text-muted)]">
            <Loader2 className="size-5 animate-spin text-[var(--brand-bright)]" />
            Writing your report…
          </p>
        ) : null}

        {session.phase === "error" ? (
          <div className="rounded-[var(--radius)] border border-[var(--danger)] bg-[rgba(224,108,96,0.08)] p-5">
            <p className="font-semibold text-[var(--danger)]">
              That didn&apos;t work
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
              {session.error}
            </p>
            <button
              type="button"
              onClick={session.retry}
              className="mt-4 rounded-[var(--radius-sm)] bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Try again
            </button>
          </div>
        ) : null}

        {session.phase === "asking" && session.question ? (
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-[var(--brand-bright)]">
              <Volume2 className="size-4" />
              QUESTION {session.questionNumber}
            </p>
            {/* break-words matters: a long unbroken token in a generated
                question would otherwise push the card past its container. */}
            <p className="mt-4 text-[26px] font-semibold leading-[1.35] break-words hyphens-auto">
              {session.question}
            </p>
          </div>
        ) : null}

        {report ? <Report report={report} reportId={savedReportId} router={router} /> : null}
      </section>

      {session.phase === "asking" ? (
        <div className="border-t border-[var(--border)] pt-5">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
            }}
            rows={4}
            placeholder={
              supported
                ? "Tap the mic and answer out loud, or type here."
                : "Type your answer here."
            }
            className="w-full resize-none rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3.5 leading-relaxed outline-none placeholder:text-[var(--text-faint)] focus:border-[var(--brand-bright)]"
          />

          <div className="mt-3 flex flex-wrap items-center gap-3">
            {supported ? (
              <button
                type="button"
                onClick={() => (listening ? stop() : start())}
                className={[
                  "inline-flex items-center gap-2 rounded-[var(--radius)] px-5 py-3 font-semibold transition-colors",
                  listening
                    ? "bg-[var(--danger)] text-white"
                    : "border border-[var(--border)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)]",
                ].join(" ")}
              >
                {listening ? (
                  <>
                    <Square className="size-4 fill-current" />
                    Listening… tap to stop
                  </>
                ) : (
                  <>
                    <Mic className="size-4" />
                    Tap to speak
                  </>
                )}
              </button>
            ) : null}

            <button
              type="button"
              onClick={send}
              disabled={!answer.trim()}
              className="inline-flex items-center gap-2 rounded-[var(--radius)] bg-[var(--brand)] px-6 py-3 font-semibold text-white transition-colors hover:bg-[var(--brand-hover)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="size-4" />
              {session.questionNumber >= session.questionCount
                ? "Send & finish"
                : "Send answer"}
            </button>

            <span className="text-xs text-[var(--text-faint)]">⌘↵ to send</span>
          </div>
        </div>
      ) : null}
    </main>
  );
}

/** The end-of-session report, shown in place rather than on another page. */
function Report({
  report,
  reportId,
  router,
}: {
  report: import("@/hooks/useInterviewSession").FullReport;
  reportId: string | null;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <div>
      <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-[var(--brand-bright)]">
        <CheckCircle2 className="size-4" />
        SESSION COMPLETE
      </p>
      <h2 className="mt-3 text-[28px] font-bold">Here&apos;s what to work on.</h2>

      <div className="mt-4">
        <UnderstandingBadge level={(report.overall ?? "").toLowerCase()} />
      </div>
      <p className="mt-4 leading-relaxed text-[var(--text-muted)]">
        {report.summary}
      </p>

      {report.perQuestion?.length ? (
        <div className="mt-8 space-y-3">
          {report.perQuestion.map((item, i) => (
            <article
              key={i}
              className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5"
            >
              <UnderstandingBadge level={item.tier?.toLowerCase()} short />
              <p className="mt-3 font-semibold leading-relaxed break-words">
                {item.question}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                {item.note}
              </p>
            </article>
          ))}
        </div>
      ) : null}

      {report.resources?.length ? (
        <div className="mt-8 rounded-[var(--radius)] border border-[var(--brand)] bg-[var(--brand-dim)] p-5">
          <h3 className="flex items-center gap-2 font-bold">
            <BookOpen className="size-5 text-[var(--brand-bright)]" />
            What to study next
          </h3>
          <ul className="mt-4 space-y-4">
            {report.resources.map((resource, i) => (
              <li key={i}>
                <p className="font-semibold">{resource.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">
                  {resource.why}
                </p>
                {/* Searches rather than links: a model asked for URLs invents
                    plausible ones that 404, and a dead link is worse than a
                    search that works. */}
                <div className="mt-2 flex flex-wrap gap-2">
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(resource.searchQuery)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-[var(--surface-2)]"
                  >
                    <Search className="size-3.5" />
                    Read about it
                  </a>
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(resource.searchQuery)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-[var(--surface-2)]"
                  >
                    <PlayCircle className="size-3.5" />
                    Watch
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => router.push("/mock")}
          className="inline-flex items-center gap-2 rounded-[var(--radius)] bg-[var(--brand)] px-6 py-3 font-semibold text-white transition-colors hover:bg-[var(--brand-hover)]"
        >
          Another track
          <ArrowRight className="size-4" />
        </button>
        {reportId ? (
          <button
            type="button"
            onClick={() => router.push(`/reports/${reportId}`)}
            className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] px-6 py-3 font-semibold transition-colors hover:bg-[var(--surface-3)]"
          >
            Open saved report
          </button>
        ) : null}
      </div>
    </div>
  );
}
