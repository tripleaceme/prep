import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, BookOpen, CheckCircle2 } from "lucide-react";
import { callApi } from "@/lib/api";
import { readSession } from "@/lib/session";
import { getTrack } from "@/lib/tracks";
import { UnderstandingBadge } from "@/components/UnderstandingBadge";

export const metadata = { title: "Report" };

interface ReportDetail {
  id: string;
  overall_score: number | null;
  understanding: "surface" | "working" | "strong" | null;
  summary: string | null;
  strengths: string[];
  knowledge_gaps: { question: string; tier: string; note: string }[];
  topics_to_review: string[];
  transcript: { role: "interviewer" | "candidate"; text: string }[];
  created_at: string;
  kind: "ai" | "mock";
  track: string | null;
  role_title: string | null;
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await readSession();
  if (!session) redirect("/login");

  let report: ReportDetail;
  try {
    const data = await callApi<{ report: ReportDetail }>(`reports/${id}`, {
      userId: session.userId,
    });
    report = data.report;
  } catch {
    notFound();
  }

  const label =
    report.kind === "mock" && report.track
      ? (getTrack(report.track)?.name ?? "Mock interview")
      : (report.role_title ?? "AI interview");

  return (
    <main className="mx-auto max-w-[860px] px-6 py-10 lg:px-10">
      <Link
        href="/reports"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text)]"
      >
        <ArrowLeft className="size-4" />
        All reports
      </Link>

      <header className="mt-6 border-b border-[var(--border)] pb-8">
        <p className="text-xs font-semibold tracking-[0.14em] text-[var(--text-faint)]">
          {report.kind === "mock" ? "MOCK INTERVIEW" : "AI INTERVIEW"}
        </p>
        <h1 className="mt-2 text-[32px] font-bold">{label}</h1>

        <div className="mt-5 flex flex-wrap items-center gap-5">
          <div>
            <p className="text-[42px] font-bold leading-none">
              {report.overall_score ?? "—"}
              <span className="text-lg font-medium text-[var(--text-faint)]">
                /100
              </span>
            </p>
          </div>
          <UnderstandingBadge level={report.understanding} />
          <span className="text-sm text-[var(--text-faint)]">
            {new Date(report.created_at).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </span>
        </div>

        {report.summary ? (
          <p className="mt-6 max-w-[70ch] text-lg leading-relaxed text-[var(--text-muted)]">
            {report.summary}
          </p>
        ) : null}
      </header>

      {report.strengths?.length ? (
        <section className="mt-10">
          <h2 className="text-lg font-bold">What you did well</h2>
          <ul className="mt-4 space-y-2.5">
            {report.strengths.map((item, i) => (
              <li key={i} className="flex gap-3 text-[var(--text-muted)]">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--brand-bright)]" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {report.knowledge_gaps?.length ? (
        <section className="mt-10">
          <h2 className="text-lg font-bold">Question by question</h2>
          <div className="mt-4 space-y-3">
            {report.knowledge_gaps.map((item, i) => (
              <article
                key={i}
                className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5"
              >
                <UnderstandingBadge level={item.tier?.toLowerCase()} short />
                <p className="mt-3 font-semibold leading-relaxed">
                  {item.question}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                  {item.note}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {report.topics_to_review?.length ? (
        <section className="mt-10 rounded-[var(--radius)] border border-[var(--brand)] bg-[var(--brand-dim)] p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <BookOpen className="size-5 text-[var(--brand-bright)]" />
            Review these next
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {report.topics_to_review.map((topic, i) => (
              <li
                key={i}
                className="rounded-full bg-[rgba(12,135,123,0.2)] px-3.5 py-1.5 text-sm text-[var(--text)]"
              >
                {topic}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {report.transcript?.length ? (
        <section className="mt-10">
          <details className="group">
            <summary className="cursor-pointer list-none text-lg font-bold">
              <span className="inline-flex items-center gap-2">
                Full transcript
                <span className="text-sm font-normal text-[var(--text-faint)]">
                  ({report.transcript.length} turns)
                </span>
              </span>
            </summary>
            <div className="mt-5 space-y-4">
              {report.transcript.map((turn, i) => (
                <div key={i}>
                  <p className="text-xs font-semibold tracking-[0.14em] text-[var(--text-faint)]">
                    {turn.role === "interviewer" ? "INTERVIEWER" : "YOU"}
                  </p>
                  <p
                    className={[
                      "mt-1.5 leading-relaxed",
                      turn.role === "interviewer"
                        ? "text-[var(--text)]"
                        : "text-[var(--text-muted)]",
                    ].join(" ")}
                  >
                    {turn.text}
                  </p>
                </div>
              ))}
            </div>
          </details>
        </section>
      ) : null}

      <div className="mt-12 flex flex-wrap gap-3 border-t border-[var(--border)] pt-8">
        <Link
          href={report.kind === "mock" && report.track ? `/mock/${report.track}` : "/interview"}
          className="rounded-[var(--radius)] bg-[var(--brand)] px-6 py-3.5 font-semibold text-white transition-colors hover:bg-[var(--brand-hover)]"
        >
          Practise this again
        </Link>
        <Link
          href="/mock"
          className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] px-6 py-3.5 font-semibold transition-colors hover:bg-[var(--surface-3)]"
        >
          Try another track
        </Link>
      </div>
    </main>
  );
}
