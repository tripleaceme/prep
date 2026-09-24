import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, FileText } from "lucide-react";
import { callApi } from "@/lib/api";
import { readSession } from "@/lib/session";
import { getTrack } from "@/lib/tracks";
import { UnderstandingBadge } from "@/components/UnderstandingBadge";

export const metadata = { title: "My Reports" };

interface ReportRow {
  id: string;
  overall_score: number | null;
  understanding: "surface" | "working" | "strong" | null;
  summary: string | null;
  created_at: string;
  kind: "ai" | "mock";
  track: string | null;
  role_title: string | null;
}

export default async function ReportsPage() {
  const session = await readSession();
  if (!session) redirect("/login");

  let reports: ReportRow[] = [];
  let failed = false;

  try {
    const data = await callApi<{ reports: ReportRow[] }>("reports", {
      userId: session.userId,
    });
    reports = data.reports ?? [];
  } catch {
    failed = true;
  }

  return (
    <main className="mx-auto max-w-[1000px] px-6 py-10 lg:px-10">
      <h1 className="text-[34px] font-bold">My Reports</h1>
      <p className="mt-3 text-[var(--text-muted)]">
        Every interview you&apos;ve completed — revisit the full feedback and
        the gaps it found.
      </p>

      {failed ? (
        <p className="mt-8 rounded-[var(--radius)] border border-[var(--danger)] bg-[rgba(224,108,96,0.08)] p-5 text-sm text-[var(--text-muted)]">
          Couldn&apos;t load your reports right now. Refresh in a moment.
        </p>
      ) : null}

      {!failed && reports.length === 0 ? (
        <div className="mt-10 grid place-items-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-6 py-20 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-[var(--brand-dim)]">
            <FileText className="size-6 text-[var(--brand-bright)]" />
          </span>
          <h2 className="mt-6 text-xl font-bold">No reports yet</h2>
          <p className="mt-2 max-w-[46ch] text-sm leading-relaxed text-[var(--text-muted)]">
            Finish your first interview and the report will show up here, with
            what you knew, what you didn&apos;t, and what to review.
          </p>
          <Link
            href="/interview"
            className="mt-7 inline-flex items-center gap-2 rounded-[var(--radius)] bg-[var(--brand)] px-6 py-3.5 font-semibold text-white transition-colors hover:bg-[var(--brand-hover)]"
          >
            Start your first interview
            <ArrowRight className="size-4" />
          </Link>
        </div>
      ) : null}

      {reports.length > 0 ? (
        <ul className="mt-8 space-y-3">
          {reports.map((report) => {
            const label =
              report.kind === "mock" && report.track
                ? (getTrack(report.track)?.name ?? "Mock interview")
                : (report.role_title ?? "AI interview");

            return (
              <li key={report.id}>
                <Link
                  href={`/reports/${report.id}`}
                  className="flex flex-wrap items-center gap-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5 transition-colors hover:bg-[var(--surface-2)]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-semibold">{label}</span>
                      <UnderstandingBadge level={report.understanding} />
                    </div>
                    {report.summary ? (
                      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-[var(--text-muted)]">
                        {report.summary}
                      </p>
                    ) : null}
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-bold">
                      {report.overall_score ?? "—"}
                      <span className="text-sm font-medium text-[var(--text-faint)]">
                        /100
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--text-faint)]">
                      {new Date(report.created_at).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </main>
  );
}
