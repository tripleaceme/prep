"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, MailWarning, X } from "lucide-react";
import { resendVerificationAction } from "@/lib/verifyActions";

/**
 * Sits above the dashboard for anyone who hasn't confirmed their email.
 *
 * A soft gate on purpose: the account already works. Blocking the app on a
 * delivered email would lock people out whenever go54's mail gets filtered,
 * which is exactly the failure mode that made magic links a bad fit here.
 */
export function VerifyBanner({ email }: { email: string }) {
  const [dismissed, setDismissed] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (dismissed) return null;

  function resend() {
    startTransition(async () => {
      setError(null);
      const result = await resendVerificationAction();
      if (result.error) setError(result.error);
      else setSent(true);
    });
  }

  return (
    <div className="border-b border-[var(--warn)] bg-[var(--warn-dim)]">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-4 gap-y-2 px-6 py-3 lg:px-10">
        {sent ? (
          <>
            <CheckCircle2 className="size-4 shrink-0 text-[var(--brand-bright)]" />
            <p className="flex-1 text-sm">
              Sent. Check{" "}
              <span className="font-semibold">{email}</span> — and your spam
              folder, since this is the first mail we&apos;ve sent you.
            </p>
          </>
        ) : (
          <>
            <MailWarning className="size-4 shrink-0 text-[var(--warn)]" />
            <p className="flex-1 text-sm">
              <span className="font-semibold">Confirm your email.</span>{" "}
              Everything works without it, but we can&apos;t help you back in if
              you forget your password. We sent a link to {email}.
            </p>
            <button
              type="button"
              onClick={resend}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--warn)] px-3.5 py-1.5 text-sm font-semibold text-[#2a1e06] transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Resend
            </button>
          </>
        )}

        {error ? (
          <p className="w-full text-sm text-[var(--danger)]">{error}</p>
        ) : null}

        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="shrink-0 p-1 text-[var(--text-faint)] hover:text-[var(--text)]"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
