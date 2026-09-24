"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { PrepMark } from "@/components/PrepMark";
import {
  loginAction,
  registerAction,
  type AuthResult,
} from "@/lib/authActions";

const inputClass =
  "w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3.5 outline-none placeholder:text-[var(--text-faint)] focus:border-[var(--brand-bright)]";

export function AuthScreen({ mode }: { mode: "login" | "register" }) {
  const isRegister = mode === "register";
  const [state, formAction, pending] = useActionState<AuthResult | null, FormData>(
    isRegister ? registerAction : loginAction,
    null,
  );
  const [reveal, setReveal] = useState(false);

  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px]">
          <PrepMark className="mb-10" href="/" />

          <h1 className="text-[32px] font-bold">
            {isRegister ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-[var(--text-muted)]">
            {isRegister
              ? "Free, and it stays free — you bring your own AI key."
              : "Enter your details to sign in to your account"}
          </p>

          <form action={formAction} className="mt-8 space-y-5">
            {isRegister ? (
              <div>
                <label
                  htmlFor="display_name"
                  className="mb-2 block text-sm font-semibold"
                >
                  Name
                </label>
                <input
                  id="display_name"
                  name="display_name"
                  type="text"
                  autoComplete="name"
                  maxLength={120}
                  placeholder="Your name"
                  className={inputClass}
                />
              </div>
            ) : null}

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="hello@example.com"
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={reveal ? "text" : "password"}
                  required
                  minLength={isRegister ? 8 : undefined}
                  autoComplete={isRegister ? "new-password" : "current-password"}
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
              {isRegister ? (
                <p className="mt-2 text-xs text-[var(--text-faint)]">
                  At least 8 characters.
                </p>
              ) : null}
            </div>

            {isRegister ? (
              <div>
                <label
                  htmlFor="confirm"
                  className="mb-2 block text-sm font-semibold"
                >
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
            ) : null}

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
              {pending
                ? "Please wait…"
                : isRegister
                  ? "Create account"
                  : "Sign In"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[var(--text-muted)]">
            {isRegister ? "Already have an account? " : "Don't have an account? "}
            <Link
              href={isRegister ? "/login" : "/register"}
              className="font-semibold text-[var(--brand-bright)] hover:underline"
            >
              {isRegister ? "Sign in" : "Sign up"}
            </Link>
          </p>
        </div>
      </div>

      <div className="hidden items-center border-l border-[var(--border)] bg-[var(--surface)] px-14 lg:flex">
        <div className="max-w-[460px]">
          <h2 className="text-[40px] font-bold leading-[1.15]">
            Walk into your next interview ready.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-[var(--text-muted)]">
            Practice out loud against the role you&apos;re actually applying
            for, then find out what you know, what you don&apos;t, and what to
            review next.
          </p>
          <p className="mt-8 text-sm text-[var(--text-faint)]">
            Built for data and analytics roles — data modelling, orchestration,
            pipelines, quality and governance. No credits, no paywall.
          </p>
        </div>
      </div>
    </main>
  );
}
