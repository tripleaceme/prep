"use client";

import Link from "next/link";
import { useActionState } from "react";
import { MailCheck } from "lucide-react";
import { PrepMark } from "@/components/PrepMark";
import { requestResetAction, type AuthResult } from "@/lib/authActions";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<
    (AuthResult & { sent?: boolean }) | null,
    FormData
  >(requestResetAction, null);

  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-12">
      <div className="w-full max-w-[400px]">
        <PrepMark className="mb-10" href="/" />

        {state?.sent ? (
          <>
            <span className="mb-5 grid size-12 place-items-center rounded-full bg-[var(--brand-dim)]">
              <MailCheck className="size-6 text-[var(--brand-bright)]" />
            </span>
            <h1 className="text-[30px] font-bold">Check your email</h1>
            <p className="mt-3 leading-relaxed text-[var(--text-muted)]">
              If that address has an account, a reset link is on its way. It
              works once and expires in 15 minutes.
            </p>
            <p className="mt-5 text-sm leading-relaxed text-[var(--text-faint)]">
              Nothing arrived? Check spam, then try again — requesting a new
              link cancels the previous one.
            </p>
            <Link
              href="/login"
              className="mt-7 inline-block text-sm font-semibold text-[var(--brand-bright)] hover:underline"
            >
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-[32px] font-bold">Forgot your password?</h1>
            <p className="mt-2 text-[var(--text-muted)]">
              Enter your email and we&apos;ll send you a link to choose a new
              one.
            </p>

            <form action={formAction} className="mt-8 space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  placeholder="hello@example.com"
                  className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3.5 outline-none placeholder:text-[var(--text-faint)] focus:border-[var(--brand-bright)]"
                />
              </div>

              {state?.error ? (
                <p role="alert" className="text-sm text-[var(--danger)]">
                  {state.error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-[var(--radius)] bg-[var(--brand)] px-6 py-3.5 font-semibold text-white transition-colors hover:bg-[var(--brand-hover)] disabled:opacity-60"
              >
                {pending ? "Sending…" : "Email me a reset link"}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-[var(--text-muted)]">
              Remembered it?{" "}
              <Link
                href="/login"
                className="font-semibold text-[var(--brand-bright)] hover:underline"
              >
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
