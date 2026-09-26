"use server";

import { redirect } from "next/navigation";
import {
  checkAdminCredentials,
  createAdminSession,
  destroyAdminSession,
} from "@/lib/adminSession";

export interface LoginResult {
  error?: string;
}

export async function analyticsLoginAction(
  _prev: LoginResult | null,
  formData: FormData,
): Promise<LoginResult> {
  // Trimmed but not lowercased. checkAdminCredentials lowercases it for the
  // account lookup, where addresses are stored lowercase, and keeps the raw
  // value for the ANALYTICS_USERNAME comparison, which is an exact match —
  // folding case here would make any username with a capital in it unusable.
  const identifier = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!identifier || !password) {
    return { error: "Enter your email and password." };
  }

  const ok = await checkAdminCredentials(identifier, password);
  if (!ok) {
    // One message for every failure: wrong address, wrong password, or a real
    // password on an account that has not been granted admin. Saying which
    // would tell someone probing this page which accounts are worth pursuing.
    return { error: "That email or password is not right." };
  }

  await createAdminSession(identifier);
  redirect("/analytics");
}

export async function analyticsLogoutAction(): Promise<void> {
  await destroyAdminSession();
  redirect("/analytics");
}
