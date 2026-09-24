"use server";

import { redirect } from "next/navigation";
import { ApiError, callApi } from "@/lib/api";
import { createSession } from "@/lib/session";

interface AuthResponse {
  user: {
    id: string;
    email: string;
    display_name: string | null;
    onboarded: boolean;
  };
}

export interface AuthResult {
  error?: string;
}

async function authenticate(
  path: "auth/login" | "auth/register",
  body: Record<string, string>,
): Promise<{ result: AuthResult } | { destination: string }> {
  try {
    const { user } = await callApi<AuthResponse>(path, {
      method: "POST",
      body,
    });
    await createSession({ userId: user.id, email: user.email });
    return { destination: user.onboarded ? "/dashboard" : "/onboarding" };
  } catch (error) {
    if (error instanceof ApiError) {
      return { result: { error: error.message } };
    }
    return {
      result: { error: "Couldn't reach the server. Please try again." },
    };
  }
}

export async function loginAction(
  _prev: AuthResult | null,
  formData: FormData,
): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const outcome = await authenticate("auth/login", { email, password });
  // redirect() signals by throwing, so it must happen outside the try above.
  if ("destination" in outcome) redirect(outcome.destination);
  return outcome.result;
}

export async function registerAction(
  _prev: AuthResult | null,
  formData: FormData,
): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const displayName = String(formData.get("display_name") ?? "").trim();

  if (!email || !password) {
    return { error: "Enter your email and a password." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirm) {
    return { error: "Those passwords don't match." };
  }

  const outcome = await authenticate("auth/register", {
    email,
    password,
    display_name: displayName,
  });
  if ("destination" in outcome) redirect(outcome.destination);
  return outcome.result;
}
