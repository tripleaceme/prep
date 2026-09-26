"use client";

import { Globe } from "lucide-react";
import { LANGS, type Lang } from "@/lib/i18n/dictionary";
import { useI18n } from "@/lib/i18n/context";

/**
 * The language picker, as the original had it in the landing header.
 *
 * Options are labelled in their own language — Français, not "French" — which
 * is the one convention that lets someone who cannot read the current
 * interface still find their way out of it.
 */
export function LanguageSelect({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useI18n();

  return (
    <label
      className={[
        "inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] transition-colors focus-within:border-[var(--brand-bright)]",
        compact ? "px-2.5 py-1.5" : "px-3 py-2.5",
      ].join(" ")}
    >
      <Globe
        className={compact ? "size-4 text-[var(--text-faint)]" : "size-4 text-[var(--text-muted)]"}
        aria-hidden
      />
      <span className="sr-only">Language</span>
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as Lang)}
        className={[
          "cursor-pointer appearance-none bg-transparent pr-1 outline-none",
          compact ? "text-sm" : "",
        ].join(" ")}
      >
        {(Object.keys(LANGS) as Lang[]).map((code) => (
          <option key={code} value={code} className="bg-[var(--surface)]">
            {LANGS[code].endonym}
          </option>
        ))}
      </select>
    </label>
  );
}
