import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { PrepMark } from "@/components/PrepMark";

export const metadata = {
  title: "Account deleted",
  // Nothing here is worth indexing, and a "your account has been deleted" page
  // turning up in search results is a bad look for a product.
  robots: { index: false, follow: false },
};

/**
 * Where you land after deleting your account.
 *
 * A separate public page rather than a panel on the settings screen, because
 * deleting the account clears the session cookie — and the proxy bounces every
 * signed-in path to /login the moment that cookie is gone. A confirmation
 * rendered inside the dashboard would be replaced by the sign-in form before
 * anyone could read it.
 */
export default function GoodbyePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-[420px]">
        <PrepMark href="/" />

        <span className="mt-8 grid size-12 place-items-center rounded-[var(--radius)] bg-[var(--brand-dim)]">
          <CheckCircle2 className="size-6 text-[var(--brand-bright)]" />
        </span>

        <h1 className="mt-6 text-[30px] font-bold">Your account has been deleted</h1>

        <p className="mt-3 leading-relaxed text-[var(--text-muted)]">
          Your interviews, reports and coding attempts have been removed and
          you&apos;ve been signed out. We&apos;ve emailed you a confirmation.
        </p>

        <p className="mt-4 leading-relaxed text-[var(--text-muted)]">
          If this wasn&apos;t you, reply to that email straight away.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-[var(--radius)] bg-[var(--brand)] px-6 py-3.5 font-semibold text-white transition-colors hover:bg-[var(--brand-hover)]"
          >
            Back to Prep
          </Link>
          <Link
            href="/register"
            className="rounded-[var(--radius)] border border-[var(--border)] px-6 py-3.5 font-semibold transition-colors hover:bg-[var(--surface-2)]"
          >
            Start again
          </Link>
        </div>
      </div>
    </main>
  );
}
