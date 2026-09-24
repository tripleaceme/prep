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
  path: "auth/login" | "auth/register" | "auth/reset",
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

export async function requestResetAction(
  _prev: AuthResult | null,
  formData: FormData,
): Promise<AuthResult & { sent?: boolean }> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }

  try {
    await callApi("auth/request-reset", { method: "POST", body: { email } });
  } catch (error) {
    // A rate-limit message is worth showing; anything else stays generic so
    // this endpoint can't be used to work out who has an account.
    if (error instanceof ApiError && error.status === 429) {
      return { error: error.message };
    }
  }

  // Always reported as sent, whether or not the address is registered.
  return { sent: true };
}

export async function resetPasswordAction(
  _prev: AuthResult | null,
  formData: FormData,
): Promise<AuthResult> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!token) return { error: "That link is missing its token." };
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirm) {
    return { error: "Those passwords don't match." };
  }

  const outcome = await authenticate("auth/reset", { token, password });
  if ("destination" in outcome) redirect(outcome.destination);
  return outcome.result;
}
