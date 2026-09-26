"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { callInteractionJson, MissingKeyError } from "@/lib/gemini/client";
import { PERSONA_NAMES, PERSONA_VOICES, speak, stopSpeaking } from "@/lib/gemini/speech";
import {
  buildAnswerFeedbackPrompt,
  buildQuestionPlanPrompt,
  FINAL_REPORT_PROMPT,
  scoreFromReview,
  tierToUnderstanding,
  type AnswerFeedback,
  type QuestionPlan,
  type ReviewJson,
  type StudyResource,
} from "@/lib/gemini/prompts";
import { completeInterview } from "@/lib/interviewActions";

/**
 * Drives an interview, for both the AI Interview and the Mock Interview
 * tracks. The two differ in appearance and in how they are configured; the
 * mechanics below are identical.
 *
 * The whole question set is written in one call before the first question
 * appears. Submitting an answer then shows the next one immediately, because
 * it already exists. The previous design asked the model for each question in
 * turn, which meant a wait — and a "someone is thinking" placeholder — after
 * every single answer.
 */

export type Phase =
  | "planning"
  | "asking"
  | "feedback"
  | "reviewing"
  | "error"
  | "needs-key";

export interface Turn {
  role: "interviewer" | "candidate";
  text: string;
}

export interface FullReport extends ReviewJson {
  resources?: StudyResource[];
}

interface Options {
  interviewId: string;
  /** Re-sent on every call; not part of a persisted conversation. */
  systemInstruction: string;
  reviewInstruction: string;
  questionCount: number;
  /** "immediate" shows feedback between questions; "end" never does. */
  timing: "immediate" | "end";
  /** Where to send them once the report is saved. */
  onSaved?: (reportId: string) => void;
}

export function useInterviewSession({
  interviewId,
  systemInstruction,
  reviewInstruction,
  questionCount,
  timing,
  onSaved,
}: Options) {
  const router = useRouter();

  const [persona] = useState(
    () => PERSONA_NAMES[Math.floor(Math.random() * PERSONA_NAMES.length)],
  );
  const voice = PERSONA_VOICES[persona];

  const [phase, setPhase] = useState<Phase>("planning");
  const [questions, setQuestions] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [report, setReport] = useState<FullReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startedRef = useRef(false);
  const questionsRef = useRef<string[]>([]);

  const fail = useCallback((err: unknown) => {
    stopSpeaking();
    if (err instanceof MissingKeyError) {
      setPhase("needs-key");
      return;
    }
    setError(err instanceof Error ? err.message : "Something went wrong.");
    setPhase("error");
  }, []);

  /** Writes the entire question set, then opens with the first one. */
  const plan = useCallback(async () => {
    setPhase("planning");
    setError(null);
    try {
      const { data } = await callInteractionJson<QuestionPlan>(
        buildQuestionPlanPrompt(questionCount),
        { systemInstruction },
      );
      const list = (data.questions ?? []).filter(
        (q) => typeof q === "string" && q.trim(),
      );
      if (!list.length) throw new Error("No questions came back. Try again.");

      questionsRef.current = list;
      setQuestions(list);
      setIndex(0);
      setTurns([{ role: "interviewer", text: list[0] }]);
      setPhase("asking");
      void speak(list[0], voice);
    } catch (err) {
      fail(err);
    }
  }, [fail, questionCount, systemInstruction, voice]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void plan();
    return () => stopSpeaking();
  }, [plan]);

  const finish = useCallback(
    async (finalTurns: Turn[]) => {
      stopSpeaking();
      setPhase("reviewing");
      setError(null);

      const transcript = finalTurns
        .map((t) => `${t.role === "interviewer" ? "Interviewer" : "Candidate"}: ${t.text}`)
        .join("\n\n");

      try {
        const { data } = await callInteractionJson<FullReport>(
          `${transcript}\n\n${FINAL_REPORT_PROMPT}`,
          { systemInstruction: reviewInstruction },
        );
        setReport(data);

        const saved = await completeInterview({
          interview_id: interviewId,
          question_count: questionsRef.current.length,
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

        if ("reportId" in saved) {
          router.refresh();
          onSaved?.(saved.reportId);
        }
        setPhase("reviewing");
      } catch (err) {
        fail(err);
      }
    },
    [fail, interviewId, onSaved, reviewInstruction, router],
  );

  /** Moves to the next question, or ends the interview if that was the last. */
  const advance = useCallback(
    (answeredTurns: Turn[]) => {
      const next = index + 1;
      if (next >= questionsRef.current.length) {
        void finish(answeredTurns);
        return;
      }
      const question = questionsRef.current[next];
      setFeedback(null);
      setIndex(next);
      setTurns([...answeredTurns, { role: "interviewer", text: question }]);
      setPhase("asking");
      void speak(question, voice);
    },
    [finish, index, voice],
  );

  /**
   * Records an answer. With feedback set to the end of the session this moves
   * straight on; with immediate feedback it fetches that first, and the
   * candidate advances when they've read it.
   */
  const submitAnswer = useCallback(
    async (answer: string) => {
      const text = answer.trim();
      if (!text || phase !== "asking") return;

      stopSpeaking();
      const answered: Turn[] = [...turns, { role: "candidate", text }];
      setTurns(answered);

      if (timing !== "immediate") {
        advance(answered);
        return;
      }

      setPhase("feedback");
      try {
        const { data } = await callInteractionJson<AnswerFeedback>(
          buildAnswerFeedbackPrompt(questionsRef.current[index], text),
          { systemInstruction: reviewInstruction },
        );
        setFeedback(data);
      } catch {
        // Feedback is a nicety; losing it must not strand the interview.
        advance(answered);
      }
    },
    [advance, index, phase, reviewInstruction, timing, turns],
  );

  /** Called from the feedback card to move on. */
  const continueAfterFeedback = useCallback(() => {
    advance(turns);
  }, [advance, turns]);

  const endEarly = useCallback(() => {
    void finish(turns);
  }, [finish, turns]);

  return {
    persona,
    phase,
    question: questions[index] ?? "",
    questionNumber: index + 1,
    questionCount: questions.length || questionCount,
    turns,
    feedback,
    report,
    error,
    submitAnswer,
    continueAfterFeedback,
    endEarly,
    retry: plan,
  };
}
