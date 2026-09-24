"use client";

import { useState } from "react";
import { Check, ExternalLink, KeyRound, Trash2 } from "lucide-react";
import { clearApiKey, looksLikeGeminiKey, writeApiKey } from "@/lib/apiKey";
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
    if (!looksLikeGeminiKey(key)) {
      setError(
        "That doesn't look like a Gemini key — they start with \"AIza\". Check you copied the whole thing.",
      );
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
    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-6">
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-[var(--brand-dim)]">
          <KeyRound className="size-5 text-[var(--brand-bright)]" />
        </span>
        <div>
          <h2 className="text-lg font-bold">Your Gemini API key</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">
            Prep runs interviews directly from your browser using your own key.
            That is why it&apos;s free and why nothing you say in an interview
            reaches our servers. The key is stored in this browser only — we
            never receive it.
          </p>
        </div>
      </div>

      {stored ? (
        <div className="mt-6 flex flex-wrap items-center gap-4 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3.5">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-bright)]">
            <Check className="size-4" />
            Connected
          </span>
          <code className="flex-1 font-mono text-sm text-[var(--text-muted)]">
            {masked}
          </code>
          <button
            type="button"
            onClick={remove}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--danger)] hover:underline"
          >
            <Trash2 className="size-4" />
            Remove
          </button>
        </div>
      ) : null}

      <form onSubmit={save} className="mt-5">
        <label htmlFor="apikey" className="mb-2 block text-sm font-semibold">
          {stored ? "Replace key" : "Paste your key"}
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="apikey"
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="AIza…"
            className="flex-1 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3.5 font-mono text-sm outline-none placeholder:text-[var(--text-faint)] focus:border-[var(--brand-bright)]"
          />
          <button
            type="submit"
            className="rounded-[var(--radius)] bg-[var(--brand)] px-6 py-3.5 font-semibold text-white transition-colors hover:bg-[var(--brand-hover)]"
          >
            {saved ? "Saved" : "Save key"}
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
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--brand-bright)] hover:underline"
      >
        Get a free key from Google AI Studio
        <ExternalLink className="size-3.5" />
      </a>

      <p className="mt-6 border-t border-[var(--border)] pt-5 text-xs leading-relaxed text-[var(--text-faint)]">
        Anyone with access to this browser&apos;s developer tools can read the
        key, so use a key created for Prep rather than one tied to a production
        project — and revoke it in AI Studio if you ever share the machine.
      </p>
    </div>
  );
}
