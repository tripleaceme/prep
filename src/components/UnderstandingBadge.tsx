/**
 * The understanding ladder, carried over from the original app. This is Prep's
 * distinctive scoring idea, so it gets a consistent visual treatment wherever
 * it appears rather than being rendered as plain text.
 */

const LEVELS = {
  surface: {
    label: "Surface knowledge",
    className: "bg-[rgba(224,108,96,0.14)] text-[var(--danger)]",
  },
  working: {
    label: "Working knowledge",
    className: "bg-[var(--warn-dim)] text-[var(--warn)]",
  },
  strong: {
    label: "Strong understanding",
    className: "bg-[var(--brand-dim)] text-[var(--brand-bright)]",
  },
} as const;

export type UnderstandingLevel = keyof typeof LEVELS;

export function UnderstandingBadge({
  level,
  short = false,
}: {
  level: UnderstandingLevel | string | null;
  short?: boolean;
}) {
  const key = (level ?? "").toLowerCase() as UnderstandingLevel;
  const config = LEVELS[key];
  if (!config) return null;

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${config.className}`}
    >
      {short ? config.label.split(" ")[0] : config.label}
    </span>
  );
}
