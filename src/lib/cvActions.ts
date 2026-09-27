"use server";

import { revalidatePath } from "next/cache";
import { ApiError, callApi } from "@/lib/api";
import { readSession } from "@/lib/session";

/**
 * Saving and reading CV revamps.
 *
 * The rewrite itself happens in the browser against the reader's own key, the
 * same as an AI interview. Only the result comes here, so history survives a
 * cleared browser and follows the account to another device.
 */

export interface CvRevampSummary {
  id: string;
  role_title: string | null;
  source_name: string | null;
  created_at: string;
}

export interface CvRevampDetail extends CvRevampSummary {
  revamped_cv: string;
  changes: { change: string; why: string }[];
  missing_keywords: string[];
  honest_gaps: string[];
}

export async function listCvRevamps(): Promise<CvRevampSummary[]> {
  const session = await readSession();
  if (!session) return [];

  try {
    const { revamps } = await callApi<{ revamps: CvRevampSummary[] }>("cv", {
      userId: session.userId,
    });
    return revamps ?? [];
  } catch {
    // History is a convenience. Losing it must not stop somebody revamping a
    // CV, so the page renders without it.
    return [];
  }
}

export async function getCvRevamp(id: string): Promise<CvRevampDetail | null> {
  const session = await readSession();
  if (!session) return null;

  try {
    const { revamp } = await callApi<{ revamp: CvRevampDetail }>(`cv/${id}`, {
      userId: session.userId,
    });
    return revamp ?? null;
  } catch {
    return null;
  }
}

export async function saveCvRevamp(input: {
  role_title: string | null;
  source_name: string | null;
  revamped_cv: string;
  changes: { change: string; why: string }[];
  missing_keywords: string[];
  honest_gaps: string[];
}): Promise<{ id?: string; error?: string }> {
  const session = await readSession();
  if (!session) return { error: "Your session expired." };

  try {
    const { id } = await callApi<{ id: string }>("cv", {
      method: "POST",
      body: input,
      userId: session.userId,
    });
    revalidatePath("/cv");
    return { id };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return {
        error:
          "The server doesn't have the CV history endpoint yet — re-upload the api/ folder to go54 and run the cv_revamps migration.",
      };
    }
    return { error: "Could not save that revamp." };
  }
}

export async function clearCvRevamps(): Promise<void> {
  const session = await readSession();
  if (!session) return;

  try {
    await callApi("cv/clear", { method: "POST", userId: session.userId });
    revalidatePath("/cv");
  } catch {
    /* the caller refreshes either way */
  }
}
