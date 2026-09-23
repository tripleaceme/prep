"use server";

import { redirect } from "next/navigation";
import { callApi } from "@/lib/api";
import { readSession } from "@/lib/session";

export interface OnboardingAnswers {
  career_stage: string;
  employer_type: string;
  goal: string;
  field: string;
}

export async function saveOnboarding(answers: OnboardingAnswers) {
  const session = await readSession();
  if (!session) redirect("/login");

  try {
    await callApi("profile", {
      method: "POST",
      body: answers,
      userId: session.userId,
    });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not save your answers. Please try again.",
    };
  }

  redirect("/dashboard");
}
