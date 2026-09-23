"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { MailCheck } from "lucide-react";
import { PrepMark } from "@/components/PrepMark";

export function LoginForm() {
  const params = useSearchParams();
  const linkError = params.get("error");

  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(
    linkError === "expired"
      ? "That link has expired or was already used. Here's a fresh one."
      : null,
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/request-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload?.error ?? "Something went wrong.");
        setBusy(false);
        return;
      }
      setSent(true);
    } catch {
      setError("Couldn't reach the server. Check your connection.");
    }
    setBusy(false);
  }

  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px]">
          <PrepMark className="mb-10" href="/" />

          {sent ? (
            <>
              <span className="mb-5 grid size-12 place-items-center rounded-full bg-[var(--brand-dim)]">
                <MailCheck className="size-6 text-[var(--brand-bright)]" />
              </span>
              <h1 className="text-[30px] font-bold">Check your email</h1>
              <p className="mt-3 leading-relaxed text-[var(--text-muted)]">
                We sent a sign-in link to{" "}
                <span className="font-semibold text-[var(--text)]">{email}</span>.
                It works once and expires in 15 minutes.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSent(false);
                  setError(null);
                }}
                className="mt-7 text-sm font-semibold text-[var(--brand-bright)] hover:underline"
              >
                Use a different email
              </button>
            </>
          ) : (
            <>
              <h1 className="text-[32px] font-bold">Sign in to Prep</h1>
              <p className="mt-2 text-[var(--text-muted)]">
                No password needed. We&apos;ll email you a link — first time in
                creates your account.
              </p>

              <form onSubmit={onSubmit} className="mt-8 space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="hello@example.com"
                    className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3.5 outline-none placeholder:text-[var(--text-faint)] focus:border-[var(--brand-bright)]"
                  />
                </div>

                {error ? (
                  <p className="text-sm text-[var(--danger)]">{error}</p>
                ) : null}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-[var(--radius)] bg-[var(--brand)] px-6 py-3.5 font-semibold text-white transition-colors hover:bg-[var(--brand-hover)] disabled:opacity-60"
                >
                  {busy ? "Sending…" : "Email me a sign-in link"}
                </button>
              </form>

              <p className="mt-6 text-sm leading-relaxed text-[var(--text-faint)]">
                Prep is free. You bring your own AI key, so there are no credits
                to buy and nothing you say in an interview reaches our servers.
              </p>
            </>
          )}
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
            pipelines, quality and governance.
          </p>
        </div>
      </div>
    </main>
  );
}
