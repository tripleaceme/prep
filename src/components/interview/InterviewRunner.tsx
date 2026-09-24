"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mic, Send, Square, Volume2 } from "lucide-react";
import { callInteraction, callInteractionJson, MissingKeyError } from "@/lib/gemini/client";
import { PERSONA_NAMES, PERSONA_VOICES, speak, stopSpeaking } from "@/lib/gemini/speech";
import {
  buildReviewInstruction,
  buildSystemInstruction,
  FIRST_QUESTION_PROMPT,
  REVIEW_PROMPT,
  scoreFromReview,
  tierToUnderstanding,
  type InterviewSetup,
  type ReviewJson,
} from "@/lib/gemini/prompts";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { completeInterview } from "@/lib/interviewActions";
import { ApiKeyPrompt } from "./ApiKeyPrompt";

type Phase = "starting" | "asking" | "answering" | "reviewing" | "error";

interface Turn {
  role: "interviewer" | "candidate";
  text: string;
}

interface Props {
  interviewId: string;
  setup: Omit<InterviewSetup, "personaName" | "personaRole">;
  /** Shown above the transcript so people know what they're practising. */
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

  // Cast once, in a lazy initialiser rather than during render: calling
  // Math.random() in the render body is impure and re-rolls every pass.
  const [persona] = useState(
    () => PERSONA_NAMES[Math.floor(Math.random() * PERSONA_NAMES.length)],
  );
  const voice = PERSONA_VOICES[persona];

  const fullSetup: InterviewSetup = {
    ...setup,
    personaName: persona,
    personaRole:
      setup.kind === "mock" ? "Senior Data Engineer" : "Hiring Manager",
  };

  const [phase, setPhase] = useState<Phase>("starting");
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [needsKey, setNeedsKey] = useState(false);

  const previousIdRef = useRef<string | null>(null);
  const questionCountRef = useRef(0);
  const startedRef = useRef(false);

  const { supported, listening, transcript, start, stop, reset } =
    useSpeechRecognition();

  // Voice input writes into the same box someone can type in, so they can
  // correct a mis-transcription before sending. Adjusting state during render
  // (rather than in an effect) is React's own pattern for this, and avoids the
  // extra render pass an effect would cost on every interim transcript.
  const [appliedTranscript, setAppliedTranscript] = useState("");
  if (transcript !== appliedTranscript) {
    setAppliedTranscript(transcript);
    if (transcript) setAnswer(transcript);
  }

  const handleFailure = useCallback((err: unknown) => {
    stopSpeaking();
    if (err instanceof MissingKeyError) {
      setNeedsKey(true);
      setPhase("error");
      return;
    }
    setError(err instanceof Error ? err.message : "Something went wrong.");
    setPhase("error");
  }, []);

  const ask = useCallback(
    async (input: string) => {
      setPhase("asking");
      setError(null);
      try {
        const result = await callInteraction(input, {
          systemInstruction: buildSystemInstruction(fullSetup),
          previousId: previousIdRef.current,
        });
        previousIdRef.current = result.id;
        questionCountRef.current += 1;

        setQuestion(result.text);
        setTurns((t) => [...t, { role: "interviewer", text: result.text }]);
        setPhase("answering");
        void speak(result.text, voice);
      } catch (err) {
        handleFailure(err);
      }
    },
    // fullSetup is rebuilt each render but its contents are stable for the
    // lifetime of the session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [voice, handleFailure],
  );

  // Kick off the first question exactly once, even under Strict Mode.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void ask(FIRST_QUESTION_PROMPT);
    return () => stopSpeaking();
  }, [ask]);

  function submitAnswer() {
    const text = answer.trim();
    if (!text || phase !== "answering") return;

    stop();
    stopSpeaking();
    setTurns((t) => [...t, { role: "candidate", text }]);
    setAnswer("");
    reset();

    if (questionCountRef.current >= maxQuestions) {
      void finish([...turns, { role: "candidate", text }]);
      return;
    }
    void ask(text);
  }

  async function finish(finalTurns: Turn[]) {
    stop();
    stopSpeaking();
    setPhase("reviewing");
    setError(null);

    try {
      const { data } = await callInteractionJson<ReviewJson>(REVIEW_PROMPT, {
        systemInstruction: buildReviewInstruction(fullSetup),
        previousId: previousIdRef.current,
      });

      const outcome = await completeInterview({
        interview_id: interviewId,
        question_count: questionCountRef.current,
        report: {
          overall_score: scoreFromReview(data),
          understanding: tierToUnderstanding(data.overall ?? "surface"),
          summary: data.summary ?? "",
          strengths: data.strengths ?? [],
          knowledge_gaps: data.perQuestion ?? [],
          topics_to_review: data.toReview ?? [],
          transcript: finalTurns,
        },
      });

      if ("error" in outcome) {
        setError(outcome.error);
        setPhase("error");
        return;
      }
      router.push(`/reports/${outcome.reportId}`);
    } catch (err) {
      handleFailure(err);
    }
  }

  if (needsKey) return <ApiKeyPrompt />;

  const progress = Math.min(questionCountRef.current, maxQuestions);

  return (
    <main className="mx-auto flex min-h-dvh max-w-[820px] flex-col px-6 py-8 lg:px-10">
      <header className="flex items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.14em] text-[var(--text-faint)]">
            {title.toUpperCase()}
          </p>
          <p className="mt-1 truncate text-sm text-[var(--text-muted)]">
            {persona} · {fullSetup.personaRole}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <span className="text-sm text-[var(--text-muted)]">
            Question {progress} of {maxQuestions}
          </span>
          <button
            type="button"
            onClick={() => void finish(turns)}
            disabled={phase === "reviewing" || turns.length === 0}
            className="rounded-[var(--radius-sm)] border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)] disabled:opacity-40"
          >
            End & review
          </button>
        </div>
      </header>

      <div className="mt-1 h-[3px] w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
        <div
          className="h-full rounded-full bg-[var(--brand-bright)] transition-[width] duration-500"
          style={{ width: `${(progress / maxQuestions) * 100}%` }}
        />
      </div>

      <section className="flex flex-1 flex-col justify-center py-10">
        {phase === "starting" || phase === "asking" ? (
          <p className="flex items-center gap-3 text-lg text-[var(--text-muted)]">
            <Loader2 className="size-5 animate-spin text-[var(--brand-bright)]" />
            {phase === "starting"
              ? `${persona} is joining…`
              : `${persona} is thinking…`}
          </p>
        ) : null}

        {phase === "reviewing" ? (
          <p className="flex items-center gap-3 text-lg text-[var(--text-muted)]">
            <Loader2 className="size-5 animate-spin text-[var(--brand-bright)]" />
            Reviewing your answers…
          </p>
        ) : null}

        {phase === "error" ? (
          <div className="rounded-[var(--radius)] border border-[var(--danger)] bg-[rgba(224,108,96,0.08)] p-5">
            <p className="font-semibold text-[var(--danger)]">
              That didn&apos;t work
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
              {error}
            </p>
            <button
              type="button"
              onClick={() => {
                setPhase("answering");
                setError(null);
              }}
              className="mt-4 rounded-[var(--radius-sm)] bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Try again
            </button>
          </div>
        ) : null}

        {phase === "answering" && question ? (
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-[var(--brand-bright)]">
              <Volume2 className="size-4" />
              {persona.toUpperCase()} ASKS
            </p>
            <p className="mt-4 text-[26px] font-semibold leading-[1.35]">
              {question}
            </p>
          </div>
        ) : null}
      </section>

      {phase === "answering" ? (
        <div className="border-t border-[var(--border)] pt-5">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitAnswer();
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
              onClick={submitAnswer}
              disabled={!answer.trim()}
              className="inline-flex items-center gap-2 rounded-[var(--radius)] bg-[var(--brand)] px-6 py-3 font-semibold text-white transition-colors hover:bg-[var(--brand-hover)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="size-4" />
              {questionCountRef.current >= maxQuestions
                ? "Send & finish"
                : "Send answer"}
            </button>

            <span className="text-xs text-[var(--text-faint)]">⌘↵ to send</span>
          </div>

          {!supported ? (
            <p className="mt-3 text-xs text-[var(--text-faint)]">
              This browser doesn&apos;t support speech recognition — Chrome and
              Edge do. You can still type your answers.
            </p>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
