"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clock, FileText, Loader2, Trash2, X } from "lucide-react";
import {
  clearCvRevamps,
  getCvRevamp,
  type CvRevampDetail,
  type CvRevampSummary,
} from "@/lib/cvActions";

/**
 * Past revamps, as a drawer rather than a permanent column.
 *
 * The interview screen keeps its history rail open because the rail and the
 * conversation are read together. Here the revamped CV wants the full width —
 * it is a document — so history slides over it and closes again.
 *
 * The list is loaded with the page; a full revamp is fetched only when one is
 * opened, because the bodies are long and most visits open none of them.
 */
export function CvHistory({
  entries,
  open,
  onClose,
  onOpenRevamp,
}: {
  entries: CvRevampSummary[];
  open: boolean;
  onClose: () => void;
  onOpenRevamp: (revamp: CvRevampDetail) => void;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function clear() {
    startTransition(async () => {
      await clearCvRevamps();
      setConfirming(false);
      onClose();
      router.refresh();
    });
  }

  function openOne(id: string) {
    setLoadingId(id);
    startTransition(async () => {
      const revamp = await getCvRevamp(id);
      setLoadingId(null);
      if (revamp) {
        onOpenRevamp(revamp);
        onClose();
      }
    });
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close history"
        onClick={onClose}
        className={[
          "fixed inset-0 z-40 bg-black/60 transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
      />

      <aside
        aria-hidden={!open}
        className={[
          "fixed right-0 top-0 z-50 flex h-dvh w-[320px] flex-col border-l border-[var(--border)] bg-[var(--surface)] transition-transform",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--border)] px-5">
          <h2 className="font-bold">Past revamps</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-m-1 p-1 text-[var(--text-faint)] transition-colors hover:text-[var(--text)]"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {entries.length === 0 ? (
            <p className="px-2 py-10 text-center text-sm leading-relaxed text-[var(--text-faint)]">
              Nothing here yet. Revamp a CV and it will be kept, so you can come
              back to it without running it again.
            </p>
          ) : (
            <ul className="space-y-1">
              {entries.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => openOne(entry.id)}
                    disabled={pending}
                    className="w-full rounded-[var(--radius-sm)] px-3 py-2.5 text-left transition-colors hover:bg-[var(--surface-2)] disabled:opacity-60"
                  >
                    <span className="flex items-center gap-2">
                      {loadingId === entry.id ? (
                        <Loader2 className="size-3.5 shrink-0 animate-spin text-[var(--brand-bright)]" />
                      ) : (
                        <FileText className="size-3.5 shrink-0 text-[var(--text-faint)]" />
                      )}
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {entry.role_title?.trim() || "Untitled role"}
                      </span>
                    </span>
                    <span className="mt-1 flex items-center gap-1.5 pl-[22px] text-xs text-[var(--text-faint)]">
                      <Clock className="size-3" />
                      {new Date(entry.created_at).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                      })}
                      {entry.source_name ? ` · ${entry.source_name}` : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {entries.length ? (
          <div className="shrink-0 border-t border-[var(--border)] p-3">
            {confirming ? (
              <div className="space-y-2">
                <p className="px-1 text-xs leading-relaxed text-[var(--text-muted)]">
                  Delete every saved revamp? This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={clear}
                    disabled={pending}
                    className="flex-1 rounded-[var(--radius-sm)] bg-[var(--danger)] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {pending ? "Deleting…" : "Delete all"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    className="rounded-[var(--radius-sm)] border border-[var(--border)] px-3 py-2 text-sm font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-sm text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--danger)]"
              >
                <Trash2 className="size-3.5" />
                Clear history
              </button>
            )}
          </div>
        ) : null}
      </aside>
    </>
  );
}
