"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { deleteAccount } from "@/lib/profileActions";

type Stage = "idle" | "confirming";

/**
 * A second step rather than a browser confirm().
 *
 * confirm() is dismissable by muscle memory and cannot ask for anything, and
 * this deletion is irreversible — so confirming means filling in a real form.
 * Asking for the password is what makes an unlocked laptop insufficient to
 * destroy somebody's account, and it doubles as the "are you sure".
 *
 * There is no success state here. On success the action redirects to /goodbye,
 * because the session is gone by then and this page is behind the proxy.
 */
export function DeletePanel() {
  const [stage, setStage] = useState<Stage>("idle");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
    <section className="flex h-full flex-col rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-6">
      <h2 className="text-lg font-bold">Delete account</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">
        Permanently removes your account and everything in it. This cannot be
        undone.
      </p>

      {stage === "idle" ? (
        <button
          type="button"
          onClick={() => setStage("confirming")}
          className="mt-auto inline-flex items-center justify-center gap-2 self-start rounded-[var(--radius)] border border-[var(--danger)] px-5 py-3 font-semibold text-[var(--danger)] transition-colors hover:bg-[var(--danger)] hover:text-white"
        >
          <Trash2 className="size-4" />
          Delete my account
        </button>
      ) : (
        <form onSubmit={submit} className="mt-auto pt-5">
          <div className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-[var(--danger)] bg-[rgba(220,80,70,0.08)] p-3.5">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[var(--danger)]" />
            <p className="text-sm leading-relaxed text-[var(--text-muted)]">
              Are you sure? Your interview history and reports will be deleted
              and cannot be recovered. Enter your password to confirm.
            </p>
          </div>

          <label htmlFor="deletePassword" className="mt-4 mb-2 block text-sm font-semibold">
            Password
          </label>
          <input
            id="deletePassword"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 outline-none placeholder:text-[var(--text-faint)] focus:border-[var(--danger)]"
          />

          {error ? (
            <p role="alert" className="mt-3 text-sm leading-relaxed text-[var(--danger)]">
              {error}
            </p>
          ) : null}

          <div className="mt-4 flex gap-2.5">
            <button
              type="submit"
              disabled={pending || !password}
              className="inline-flex items-center justify-center gap-2 rounded-[var(--radius)] bg-[var(--danger)] px-5 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {pending ? "Deleting…" : "Yes, delete it"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStage("idle");
                setPassword("");
                setError(null);
              }}
              disabled={pending}
              className="rounded-[var(--radius)] border border-[var(--border)] px-5 py-3 font-semibold transition-colors hover:bg-[var(--surface-2)] disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
