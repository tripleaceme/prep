"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { PrepMark } from "@/components/PrepMark";
import { resetPasswordAction, type AuthResult } from "@/lib/authActions";

const inputClass =
  "w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3.5 outline-none placeholder:text-[var(--text-faint)] focus:border-[var(--brand-bright)]";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState<AuthResult | null, FormData>(
    resetPasswordAction,
    null,
  );
  const [reveal, setReveal] = useState(false);

  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-12">
      <div className="w-full max-w-[400px]">
        <PrepMark className="mb-10" href="/" />

        <h1 className="text-[32px] font-bold">Choose a new password</h1>
        <p className="mt-2 text-[var(--text-muted)]">
          Once you save it you&apos;ll be signed straight in.
        </p>

        <form action={formAction} className="mt-8 space-y-5">
          <input type="hidden" name="token" value={token} />

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-semibold">
              New password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={reveal ? "text" : "password"}
                required
                minLength={8}
                autoFocus
                autoComplete="new-password"
                placeholder="••••••••"
                className={`${inputClass} pr-12`}
              />
              <button
                type="button"
                onClick={() => setReveal((r) => !r)}
                aria-label={reveal ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--text-faint)] hover:text-[var(--text)]"
              >
                {reveal ? (
                  <EyeOff className="size-[18px]" />
                ) : (
                  <Eye className="size-[18px]" />
                )}
              </button>
            </div>
            <p className="mt-2 text-xs text-[var(--text-faint)]">
              At least 8 characters.
            </p>
          </div>

          <div>
            <label htmlFor="confirm" className="mb-2 block text-sm font-semibold">
              Confirm password
            </label>
            <input
              id="confirm"
              name="confirm"
              type={reveal ? "text" : "password"}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="••••••••"
              className={inputClass}
            />
          </div>

          {state?.error ? (
            <div role="alert">
              <p className="text-sm text-[var(--danger)]">{state.error}</p>
              <Link
                href="/forgot-password"
                className="mt-2 inline-block text-sm font-semibold text-[var(--brand-bright)] hover:underline"
              >
                Request a fresh link
              </Link>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-[var(--radius)] bg-[var(--brand)] px-6 py-3.5 font-semibold text-white transition-colors hover:bg-[var(--brand-hover)] disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save password & sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
