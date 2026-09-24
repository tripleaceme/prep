import Link from "next/link";
import { PrepMark } from "@/components/PrepMark";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px]">
          <PrepMark className="mb-10" href="/" />
          <h1 className="text-[30px] font-bold">This link is incomplete</h1>
          <p className="mt-3 leading-relaxed text-[var(--text-muted)]">
            Some email clients break long links across lines. Request a new one
            and open it in a single click.
          </p>
          <Link
            href="/forgot-password"
            className="mt-7 inline-block rounded-[var(--radius)] bg-[var(--brand)] px-6 py-3.5 font-semibold text-white transition-colors hover:bg-[var(--brand-hover)]"
          >
            Request a new link
          </Link>
        </div>
      </main>
    );
  }

  return <ResetPasswordForm token={token} />;
}
