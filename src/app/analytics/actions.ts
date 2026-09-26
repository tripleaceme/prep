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
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const ok = await checkAdminCredentials(email, password);
  if (!ok) {
    // One message for every failure: wrong address, wrong password, or a real
    // password on an account that has not been granted admin. Saying which
    // would tell someone probing this page which accounts are worth pursuing.
    return { error: "That email or password is not right." };
  }

  await createAdminSession(email);
  redirect("/analytics");
}

export async function analyticsLogoutAction(): Promise<void> {
  await destroyAdminSession();
  redirect("/analytics");
}
