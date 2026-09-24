"use server";

import { ApiError, callApi } from "@/lib/api";
import { readSession } from "@/lib/session";

export interface ResendResult {
  ok?: boolean;
  alreadyVerified?: boolean;
  error?: string;
}

export async function resendVerificationAction(): Promise<ResendResult> {
  const session = await readSession();
  if (!session) return { error: "Your session expired. Please sign in again." };

  try {
    const result = await callApi<{ ok: boolean; alreadyVerified?: boolean }>(
      "auth/resend-verification",
      { method: "POST", body: {}, userId: session.userId },
    );
    return { ok: true, alreadyVerified: result.alreadyVerified };
  } catch (error) {
    if (error instanceof ApiError) {
      // The rate-limit message is useful; anything else stays generic.
      return {
        error:
          error.status === 429
            ? "You've asked for a few already — check your spam folder, then try again later."
            : "We couldn't send that email. Try again shortly.",
      };
    }
    return { error: "Something went wrong. Try again shortly." };
  }
}
