import "./legacy.css";

/**
 * AI Interview keeps the original Prep design, which means its own typography:
 * Fraunces for headings, IBM Plex Sans for everything else.
 *
 * These load by stylesheet link rather than next/font, for two reasons. It is
 * exactly what the original page did, down to the same request; and Turbopack
 * currently fails to build a multi-weight next/font/google family here
 * ("next/font/google queries have exactly one entry"). The link is scoped to
 * this layout, so no other route pays for the download.
 */
export default function InterviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      {/* This rule targets the Pages Router's _document. Scoping the fonts to
          one App Router layout is the intended behaviour here, not a mistake. */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap"
      />

      <div className="legacy-shell">
        <div className="page-shell">{children}</div>
      </div>
    </>
  );
}
