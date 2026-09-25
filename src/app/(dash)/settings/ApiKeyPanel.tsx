"use client";

import { useState } from "react";
import { Check, ExternalLink, KeyRound, Trash2 } from "lucide-react";
import { clearApiKey, writeApiKey } from "@/lib/apiKey";
import { useApiKey } from "@/hooks/useApiKey";

export function ApiKeyPanel() {
  // Subscribed rather than copied into state, so saving or removing the key
  // updates this panel and the sidebar badge together.
  const stored = useApiKey();
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function save(e: React.FormEvent) {
    e.preventDefault();
    const key = value.trim();

    if (!key) {
      setError("Paste your key first.");
      return;
    }

    writeApiKey(key);
    setValue("");
    setError(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function remove() {
    clearApiKey();
    setSaved(false);
  }

  const masked = stored
    ? `${stored.slice(0, 8)}${"•".repeat(18)}${stored.slice(-4)}`
    : null;

  return (
    <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-6">
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-[var(--brand-dim)]">
          <KeyRound className="size-[18px] text-[var(--brand-bright)]" />
        </span>
        <h2 className="text-lg font-bold">Your Gemini API key</h2>
      </div>
      <p className="mt-1.5 text-sm text-[var(--text-muted)]">
        Stored in this browser only. Interviews call Google directly with it,
        so nothing you say passes through our servers.
      </p>

      {stored ? (
        <div className="mt-5 flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2.5">
          <Check className="size-4 shrink-0 text-[var(--brand-bright)]" />
          <code className="min-w-0 flex-1 truncate font-mono text-xs text-[var(--text-muted)]">
            {masked}
          </code>
          <button
            type="button"
            onClick={remove}
            aria-label="Remove key"
            className="shrink-0 p-1 text-[var(--text-faint)] transition-colors hover:text-[var(--danger)]"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ) : null}

      <form onSubmit={save} className="mt-5">
        <label htmlFor="apikey" className="mb-2 block text-sm font-semibold">
          {stored ? "Replace key" : "Paste your key"}
        </label>
        <div className="flex gap-2.5">
          <input
            id="apikey"
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="AIza…"
            className="min-w-0 flex-1 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 font-mono text-sm outline-none placeholder:text-[var(--text-faint)] focus:border-[var(--brand-bright)]"
          />
          <button
            type="submit"
            className="shrink-0 rounded-[var(--radius)] bg-[var(--brand)] px-5 py-3 font-semibold text-white transition-colors hover:bg-[var(--brand-hover)]"
          >
            {saved ? "Saved" : "Save"}
          </button>
        </div>
        {error ? (
          <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>
        ) : null}
      </form>

      <a
        href="https://aistudio.google.com/apikey"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--brand-bright)] hover:underline"
      >
        Get a free key from Google AI Studio
        <ExternalLink className="size-3.5" />
      </a>
    </section>
  );
}
