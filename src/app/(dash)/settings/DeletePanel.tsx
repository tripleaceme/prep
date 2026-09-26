"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import { deleteAccount } from "@/lib/profileActions";

/**
 * The confirmation is a modal, not an expanding section.
 *
 * Expanding in place made the card taller than its neighbour and pushed the
 * page past the screen. A modal floats above the layout, so confirming costs
 * no height at all — and it is the honest shape for this interaction anyway:
 * it takes over until you either confirm or cancel, which is what an
 * irreversible action should do.
 *
 * Asking for the password is what makes an unlocked laptop insufficient to
 * destroy someone's account, and it doubles as the "are you sure".
 *
 * There is no success state. On success the action redirects to /goodbye,
 * because the session is gone by then and this page sits behind the proxy.
 */
export function DeletePanel() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function close() {
    if (pending) return;
    setOpen(false);
    setPassword("");
    setError(null);
  }

  // Escape closes it, which is the one keyboard behaviour people assume a
  // dialog has. Bound to the document because focus may be anywhere inside.
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pending]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      // Resolves only on failure; success navigates away.
      const result = await deleteAccount(password);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <>
      <section className="flex h-full flex-col rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="text-lg font-bold">Delete account</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">
          Permanently removes your account and everything in it. This cannot be
          undone.
        </p>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-auto inline-flex items-center justify-center gap-2 self-start rounded-[var(--radius)] border border-[var(--danger)] px-5 py-3 font-semibold text-[var(--danger)] transition-colors hover:bg-[var(--danger)] hover:text-white"
        >
          <Trash2 className="size-4" />
          Delete my account
        </button>
      </section>

      {open ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            // Only a click on the backdrop itself, not one that started inside
            // the dialog and drifted out while selecting text.
            if (e.target === e.currentTarget) close();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="deleteTitle"
            /* Capped and scrollable so the dialog can never outgrow the
               screen, however long the error message turns out to be. */
            className="max-h-[90dvh] w-full max-w-[440px] overflow-y-auto rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id="deleteTitle" className="text-lg font-bold">
                Delete your account?
              </h2>
              <button
                type="button"
                onClick={close}
                disabled={pending}
                aria-label="Cancel"
                className="-m-1 shrink-0 p-1 text-[var(--text-faint)] transition-colors hover:text-[var(--text)] disabled:opacity-50"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 flex items-start gap-3 rounded-[var(--radius-sm)] border border-[var(--danger)] bg-[rgba(224,108,96,0.08)] p-3.5">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[var(--danger)]" />
              <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                Your interviews, reports and coding attempts will be deleted and
                cannot be recovered. Enter your password to confirm.
              </p>
            </div>

            <form onSubmit={submit} className="mt-5">
              <label
                htmlFor="deletePassword"
                className="mb-2 block text-sm font-semibold"
              >
                Password
              </label>
              <input
                ref={inputRef}
                id="deletePassword"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 outline-none placeholder:text-[var(--text-faint)] focus:border-[var(--danger)]"
              />

              {error ? (
                <p
                  role="alert"
                  className="mt-3 text-sm leading-relaxed text-[var(--danger)]"
                >
                  {error}
                </p>
              ) : null}

              <div className="mt-5 flex gap-2.5">
                <button
                  type="submit"
                  disabled={pending || !password}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-[var(--radius)] bg-[var(--danger)] px-5 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {pending ? <Loader2 className="size-4 animate-spin" /> : null}
                  {pending ? "Deleting…" : "Yes, delete it"}
                </button>
                <button
                  type="button"
                  onClick={close}
                  disabled={pending}
                  className="rounded-[var(--radius)] border border-[var(--border)] px-5 py-3 font-semibold transition-colors hover:bg-[var(--surface-2)] disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
