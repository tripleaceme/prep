"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { clearAiHistory } from "@/lib/historyActions";

export interface HistoryEntry {
  id: string;
  created_at: string;
  role_title: string | null;
  understanding: "surface" | "working" | "strong" | null;
  overall_score: number | null;
}

const TIER_LABEL = {
  surface: "Surface",
  working: "Working",
  strong: "Strong",
} as const;

/**
 * Past sessions.
 *
 * The original kept this rail on the left and stored sessions in localStorage.
 * It now sits on the right, only on this screen, and reads from the database —
 * so history survives a cleared browser and follows the account to any device.
 */
export function HistoryRail({
  entries,
  open,
  onClose,
}: {
  entries: HistoryEntry[];
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function clear() {
    startTransition(async () => {
      await clearAiHistory();
      setConfirming(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close history"
        className={`drawer-backdrop${open ? " open" : ""}`}
        onClick={onClose}
      />

      <aside className={`history-sidebar${open ? " open" : ""}`}>
        <div className="history-sidebar-head">
          <div>
            <h3>Past sessions</h3>
            <p className="sidebar-label">Saved to your account</p>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close history"
          >
            ✕
          </button>
        </div>

        <div className="history-list">
          {entries.length === 0 ? (
            <p className="history-empty">
              No sessions yet. Finish an interview and it will appear here.
            </p>
          ) : (
            entries.map((entry) => (
              <Link
                key={entry.id}
                href={`/reports/${entry.id}`}
                className="history-item"
              >
                <div className="hi-date">
                  {new Date(entry.created_at).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
                <div className="hi-role">
                  {entry.role_title?.trim() || "Mock interview"}
                </div>
                {entry.understanding ? (
                  <div className={`qa-tier tier-${entry.understanding}`}>
                    {TIER_LABEL[entry.understanding]}
                    {entry.overall_score !== null
                      ? ` · ${entry.overall_score}`
                      : ""}
                  </div>
                ) : null}
              </Link>
            ))
          )}
        </div>

        {entries.length > 0 ? (
          confirming ? (
            <>
              <button
                type="button"
                className="btn btn-danger history-clear"
                onClick={clear}
                disabled={pending}
              >
                {pending ? "Clearing…" : "Yes, delete them all"}
              </button>
              <button
                type="button"
                className="btn btn-ghost history-clear"
                onClick={() => setConfirming(false)}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn btn-ghost history-clear"
              onClick={() => setConfirming(true)}
            >
              Clear history
            </button>
          )
        ) : null}
      </aside>
    </>
  );
}
