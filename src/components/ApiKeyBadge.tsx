"use client";

import Link from "next/link";
import { KeyRound } from "lucide-react";
import { useHasApiKey } from "@/hooks/useApiKey";
import { useT } from "@/lib/i18n/context";

/**
 * Sits where the reference product shows a credit balance. Prep has no
 * credits, so what matters here is whether the user's own key is in place —
 * because that, not a balance, is what decides if an interview can start.
 */
export function ApiKeyBadge() {
  const connected = useHasApiKey();
  const t = useT();

  return (
    <Link
      href="/settings"
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
        connected
          ? "bg-[var(--brand-dim)] text-[var(--brand-bright)] hover:bg-[rgba(12,135,123,0.2)]"
          : "bg-[var(--warn-dim)] text-[var(--warn)] hover:bg-[rgba(217,164,65,0.2)]",
      ].join(" ")}
    >
      <KeyRound className="size-3.5" />
      {t(connected ? "AI key connected" : "AI key absent")}
    </Link>
  );
}
