"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { readApiKey, subscribeApiKey } from "@/lib/apiKey";

/**
 * Sits where the reference product shows a credit balance. Prep has no
 * credits, so what matters here is whether the user's own key is in place —
 * because that, not a balance, is what decides if an interview can start.
 */
export function ApiKeyBadge() {
  // Start unknown so the server and first client render agree; localStorage is
  // only readable after mount.
  const [connected, setConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const sync = () => setConnected(readApiKey() !== null);
    sync();
    return subscribeApiKey(sync);
  }, []);

  if (connected === null) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-faint)]">
        <KeyRound className="size-3.5" />
        Checking…
      </span>
    );
  }

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
      {connected ? "AI key connected" : "AI key absent"}
    </Link>
  );
}
