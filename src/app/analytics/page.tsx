import { callApi } from "@/lib/api";
import { readAdminSession } from "@/lib/adminSession";
import { AnalyticsLogin } from "./AnalyticsLogin";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import type { Analytics } from "./types";

export const metadata = {
  title: "Analytics",
  robots: { index: false, follow: false },
};

export default async function AnalyticsPage() {
  const admin = await readAdminSession();
  if (!admin) return <AnalyticsLogin />;

  let data: Analytics | null = null;
  let error: string | null = null;

  try {
    data = await callApi<Analytics>("analytics");
  } catch (err) {
    error = err instanceof Error ? err.message : "Could not load analytics.";
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-[600px] px-6 py-20">
        <h1 className="text-[28px] font-bold">Analytics unavailable</h1>
        <p className="mt-3 leading-relaxed text-[var(--text-muted)]">{error}</p>
        <p className="mt-4 text-sm text-[var(--text-faint)]">
          Run <code className="font-mono">node scripts/check-api.mjs</code> to
          find out which half is broken.
        </p>
      </main>
    );
  }

  return <AnalyticsDashboard data={data} admin={admin.username} />;
}
