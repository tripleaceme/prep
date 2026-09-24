"use server";

import { callApi } from "@/lib/api";
import { readSession } from "@/lib/session";

/**
 * Server actions the interview runner calls. These exist so the browser never
 * needs the API shared secret — the client posts here, and this signs the call
 * on to go54.
 */

export interface StartInterviewInput {
  kind: "ai" | "mock";
  track?: string;
  source?: "role" | "job_post" | "cv";
  role_title?: string;
  job_description?: string;
  focus?: string;
  stage?: string;
}

export interface CompleteInterviewInput {
  interview_id: string;
  question_count: number;
  report: {
    overall_score: number;
    understanding: "surface" | "working" | "strong";
    summary: string;
    strengths: string[];
    knowledge_gaps: { question: string; tier: string; note: string }[];
    topics_to_review: string[];
    transcript: { role: "interviewer" | "candidate"; text: string }[];
  };
}

async function actorId(): Promise<string | null> {
  const session = await readSession();
  return session?.userId ?? null;
}

export async function startInterview(
  input: StartInterviewInput,
): Promise<{ id: string } | { error: string }> {
  const userId = await actorId();
  if (!userId) return { error: "Your session expired. Please sign in again." };

  try {
    const { interview } = await callApi<{ interview: { id: string } }>(
      "interviews",
      { method: "POST", body: input, userId },
    );
    return { id: interview.id };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not start the session.",
    };
  }
}

export async function completeInterview(
  input: CompleteInterviewInput,
): Promise<{ reportId: string } | { error: string }> {
  const userId = await actorId();
  if (!userId) return { error: "Your session expired. Please sign in again." };

  try {
    const { report } = await callApi<{ report: { id: string } }>(
      "interviews/complete",
      { method: "POST", body: input, userId },
    );
    // Best effort: a failed streak update must not lose the report.
    try {
      await callApi("activity", {
        method: "POST",
        body: { kind: "interview" },
        userId,
      });
    } catch {
      /* ignore */
    }
    return { reportId: report.id };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not save your report.",
    };
  }
}

export async function saveCodingAttempt(input: {
  problem_slug: string;
  status: "attempted" | "solved";
  code: string;
}): Promise<{ ok: true } | { error: string }> {
  const userId = await actorId();
  if (!userId) return { error: "Your session expired. Please sign in again." };

  try {
    await callApi("coding", { method: "POST", body: input, userId });
    if (input.status === "solved") {
      try {
        await callApi("activity", {
          method: "POST",
          body: { kind: "problem" },
          userId,
        });
      } catch {
        /* ignore */
      }
    }
    return { ok: true };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not save your progress.",
    };
  }
}
