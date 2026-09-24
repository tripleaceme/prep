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
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Enter your username and password." };
  }

  const ok = await checkAdminCredentials(username, password);
  if (!ok) {
    // Deliberately does not say which half was wrong.
    return { error: "That username or password is not right." };
  }

  await createAdminSession(username);
  redirect("/analytics");
}

export async function analyticsLogoutAction(): Promise<void> {
  await destroyAdminSession();
  redirect("/analytics");
}
