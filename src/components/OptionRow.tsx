"use client";

import { Check } from "lucide-react";

interface Props {
  label: string;
  hint?: string;
  selected: boolean;
  onSelect: () => void;
  /** Grid cards (onboarding step 4) drop the radio and sit tighter. */
  compact?: boolean;
}

export function OptionRow({ label, hint, selected, onSelect, compact }: Props) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={[
        "group w-full rounded-[var(--radius)] border text-left transition-colors",
        compact ? "px-4 py-3.5" : "flex items-center gap-4 px-5 py-4",
        selected
          ? "border-[var(--brand-bright)] bg-[var(--brand-dim)]"
          : "border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)]",
      ].join(" ")}
    >
      <span className="min-w-0 flex-1">
        <span
          className={[
            "block font-semibold",
            selected ? "text-[var(--text)]" : "text-[var(--text)]",
          ].join(" ")}
        >
          {label}
        </span>
        {hint ? (
          <span className="mt-0.5 block text-sm text-[var(--text-muted)]">
            {hint}
          </span>
        ) : null}
      </span>

      {!compact ? (
        <span
          aria-hidden
          className={[
            "grid size-6 shrink-0 place-items-center rounded-full border transition-colors",
            selected
              ? "border-[var(--brand-bright)] bg-[var(--brand-bright)]"
              : "border-[var(--border-strong)]",
          ].join(" ")}
        >
          {selected ? <Check className="size-4 text-[#06201d]" strokeWidth={3} /> : null}
        </span>
      ) : null}
    </button>
  );
}
