export const metadata = { title: "Coding Problems" };

export default function Page() {
  return (
    <main className="mx-auto max-w-[900px] px-6 py-10 lg:px-10">
      <h1 className="text-[30px] font-bold">Coding Problems</h1>
      <p className="mt-3 max-w-[60ch] leading-relaxed text-[var(--text-muted)]">
        SQL from fundamentals through window functions, plus broken-pipeline scenarios to debug. Free — no AI key needed.
      </p>
      <p className="mt-6 inline-flex rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-faint)]">
        Not built yet — this screen is next in the build order.
      </p>
    </main>
  );
}
