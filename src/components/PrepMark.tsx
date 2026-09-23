import Link from "next/link";

/** Wordmark used in the onboarding header, the sidebar and the auth pages. */
export function PrepMark({
  className = "",
  href,
}: {
  className?: string;
  href?: string;
}) {
  const inner = (
    <span className="inline-flex items-center gap-2.5">
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className="size-6 text-[var(--brand-bright)]"
        fill="none"
      >
        {/* A waveform inside a speech bubble: this is a spoken interview. */}
        <path
          d="M3.5 6.5A3 3 0 0 1 6.5 3.5h11a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H9.6L5 21v-3.5h-1.5z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M8 8.8v3.4M11.3 7.2v6.6M14.6 9.4v2.2M17.2 8.2v4.6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
      <span className="text-[19px] font-bold tracking-tight">Prep</span>
    </span>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }
  return <div className={className}>{inner}</div>;
}
