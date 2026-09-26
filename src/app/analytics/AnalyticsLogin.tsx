"use client";

import { useActionState } from "react";
import { BarChart3 } from "lucide-react";
import { analyticsLoginAction, type LoginResult } from "./actions";

const inputClass =
  "w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3.5 outline-none placeholder:text-[var(--text-faint)] focus:border-[var(--brand-bright)]";

export function AnalyticsLogin() {
  const [state, formAction, pending] = useActionState<LoginResult | null, FormData>(
    analyticsLoginAction,
    null,
  );

  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-12">
      <div className="w-full max-w-[380px]">
        <span className="grid size-12 place-items-center rounded-[var(--radius)] bg-[var(--brand-dim)]">
          <BarChart3 className="size-6 text-[var(--brand-bright)]" />
        </span>

        <h1 className="mt-6 text-[30px] font-bold">Prep Analytics</h1>
        <p className="mt-2 leading-relaxed text-[var(--text-muted)]">
          Operator access. Sign in with your Prep account — it needs to have
          been granted admin.
        </p>

        <form action={formAction} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-semibold">
              Email
            </label>
            {/*
              type="text", not type="email", deliberately. Operators normally
              sign in with a Prep account address, but the break-glass path
              (ANALYTICS_USERNAME) is a plain username — and the browser's
              email validation refuses to submit one, which would make the
              documented fallback unreachable exactly when it is needed.
              inputMode keeps the phone keyboard sensible for the common case.
            */}
            <input
              id="email"
              name="email"
              type="text"
              inputMode="email"
              required
              autoFocus
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-semibold">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className={inputClass}
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
            {pending ? "Checking…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
