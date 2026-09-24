import { AlertTriangle, CheckCircle2 } from "lucide-react";

/**
 * Shown after someone returns from a confirmation link. Rendered from the
 * `?verified=` parameter the callback route adds, so it works whether they
 * land on the dashboard or the sign-in page.
 */
export function VerifiedNotice({ status }: { status?: string }) {
  if (status !== "ok" && status !== "expired" && status !== "invalid") {
    return null;
  }

  if (status === "ok") {
    return (
      <div className="mb-6 flex items-start gap-3 rounded-[var(--radius)] border border-[var(--brand)] bg-[var(--brand-dim)] p-4">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[var(--brand-bright)]" />
        <p className="text-sm leading-relaxed">
          <span className="font-semibold">Email confirmed.</span> If you ever
          forget your password, we can now get you back in.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6 flex items-start gap-3 rounded-[var(--radius)] border border-[var(--warn)] bg-[var(--warn-dim)] p-4">
      <AlertTriangle className="mt-0.5 size-5 shrink-0 text-[var(--warn)]" />
      <p className="text-sm leading-relaxed">
        {status === "expired"
          ? "That confirmation link has expired. Sign in and use the Resend button to get a fresh one."
          : "That confirmation link wasn't valid. Sign in and use the Resend button to get a fresh one."}
      </p>
    </div>
  );
}
