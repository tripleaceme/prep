/**
 * Chart pieces for the analytics dashboard.
 *
 * Built as plain server-rendered HTML rather than pulling in a charting
 * library: the data volumes here are small, everything is server-rendered
 * already, and a library would ship kilobytes of JavaScript to draw a dozen
 * bars. Every mark carries a `title` for hover, and bars are direct-labelled
 * because with this few of them a tooltip would be hiding information rather
 * than revealing it.
 */

export function StatTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5">
      <p className="text-[11px] font-semibold tracking-[0.14em] text-[var(--text-faint)]">
        {label}
      </p>
      <p className="mt-2.5 text-[30px] font-bold leading-none">{value}</p>
      {sub ? (
        <p className="mt-2 text-xs text-[var(--text-muted)]">{sub}</p>
      ) : null}
    </div>
  );
}

export function Panel({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-6">
      <h2 className="text-lg font-bold">{title}</h2>
      {hint ? (
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">
          {hint}
        </p>
      ) : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}

/**
 * The funnel. One series, so no legend — the title names it. Each step shows
 * its conversion from the step above, because the drop-off is the whole point;
 * the raw counts alone don't tell you where people leave.
 */
export function Funnel({
  steps,
}: {
  steps: { label: string; value: number; note: string }[];
}) {
  const top = Math.max(steps[0]?.value ?? 0, 1);

  return (
    <ol className="space-y-4">
      {steps.map((step, i) => {
        const previous = i === 0 ? null : steps[i - 1].value;
        const conversion =
          previous && previous > 0
            ? Math.round((step.value / previous) * 100)
            : null;

        return (
          <li key={step.label}>
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-sm font-medium">{step.label}</span>
              <span className="shrink-0 text-sm">
                <span className="font-bold">{step.value.toLocaleString()}</span>
                {conversion !== null ? (
                  <span
                    className={
                      conversion < 50
                        ? "ml-2 text-[var(--warn)]"
                        : "ml-2 text-[var(--text-faint)]"
                    }
                  >
                    {conversion}% of previous
                  </span>
                ) : null}
              </span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[var(--viz-grid)]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max((step.value / top) * 100, step.value > 0 ? 1.5 : 0)}%`,
                  background: "var(--viz-1)",
                }}
                title={`${step.label}: ${step.value}`}
              />
            </div>
            <p className="mt-1.5 text-xs text-[var(--text-faint)]">{step.note}</p>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * A 30-day column chart. Two series get a legend and are drawn side by side
 * with a 2px surface gap, never stacked — stacking would make the completed
 * count unreadable against a moving baseline.
 */
export function DailyBars({
  data,
  series,
}: {
  data: { day: string; values: number[] }[];
  series: { label: string; color: string }[];
}) {
  if (!data.length) {
    return (
      <p className="py-8 text-center text-sm text-[var(--text-faint)]">
        Nothing yet in the last 30 days.
      </p>
    );
  }

  const max = Math.max(1, ...data.flatMap((d) => d.values));
  const peakIndex = data.findIndex((d) => Math.max(...d.values) === max);

  return (
    <>
      {series.length > 1 ? (
        <ul className="mb-5 flex flex-wrap gap-5">
          {series.map((s) => (
            <li key={s.label} className="flex items-center gap-2 text-sm">
              <span
                aria-hidden
                className="size-3 rounded-[3px]"
                style={{ background: s.color }}
              />
              <span className="text-[var(--text-muted)]">{s.label}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex h-[160px] items-end gap-[3px]">
        {data.map((point, i) => (
          <div
            key={point.day}
            className="relative flex h-full flex-1 items-end justify-center gap-[2px]"
          >
            {/* The peak is labelled; every other value lives in the tooltip. */}
            {i === peakIndex ? (
              <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-[11px] font-semibold text-[var(--text-muted)]">
                {max}
              </span>
            ) : null}
            {point.values.map((value, j) => (
              <span
                key={j}
                title={`${formatDay(point.day)} · ${series[j].label}: ${value}`}
                className="w-full rounded-t-[4px] transition-opacity hover:opacity-80"
                style={{
                  height: value > 0 ? `${Math.max((value / max) * 100, 3)}%` : "2px",
                  background: value > 0 ? series[j].color : "var(--viz-grid)",
                  minWidth: "3px",
                }}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="mt-3 flex justify-between text-xs text-[var(--text-faint)]">
        <span>{formatDay(data[0].day)}</span>
        <span>{formatDay(data[data.length - 1].day)}</span>
      </div>
    </>
  );
}

/** Horizontal bars for categories — tracks, problems, the ladder. */
export function RankedBars({
  rows,
  colors,
  emptyMessage,
}: {
  rows: { label: string; value: number; sub?: string }[];
  /** One colour, or one per row for an ordinal scale. */
  colors: string | string[];
  emptyMessage: string;
}) {
  if (!rows.length) {
    return (
      <p className="py-8 text-center text-sm text-[var(--text-faint)]">
        {emptyMessage}
      </p>
    );
  }

  const max = Math.max(1, ...rows.map((r) => r.value));

  return (
    <ul className="space-y-3.5">
      {rows.map((row, i) => (
        <li key={row.label}>
          <div className="flex items-baseline justify-between gap-4">
            <span className="min-w-0 truncate text-sm font-medium">
              {row.label}
            </span>
            <span className="shrink-0 text-sm">
              <span className="font-bold">{row.value.toLocaleString()}</span>
              {row.sub ? (
                <span className="ml-2 text-[var(--text-faint)]">{row.sub}</span>
              ) : null}
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--viz-grid)]">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max((row.value / max) * 100, row.value > 0 ? 1.5 : 0)}%`,
                background: Array.isArray(colors)
                  ? (colors[i] ?? colors[colors.length - 1])
                  : colors,
              }}
              title={`${row.label}: ${row.value}`}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function formatDay(day: string): string {
  return new Date(day).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}
