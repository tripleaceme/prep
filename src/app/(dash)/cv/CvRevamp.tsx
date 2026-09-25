"use client";

import { useRef, useState } from "react";
import {
  Check,
  Copy,
  Download,
  FileText,
  Loader2,
  Sparkles,
  Upload,
} from "lucide-react";
import { callInteractionJson, MissingKeyError } from "@/lib/gemini/client";
import { readDocument } from "@/lib/readDocument";
import { ApiKeyPrompt } from "@/components/interview/ApiKeyPrompt";

interface RevampResult {
  revampedCv: string;
  changes: { change: string; why: string }[];
  missingKeywords: string[];
  honestGaps: string[];
}

const SYSTEM_INSTRUCTION = [
  "You are an experienced hiring manager for data and analytics roles, rewriting a candidate's CV to match a specific job.",
  "Rewrite only what the candidate actually did — sharpen the wording, lead with outcomes, and use the language the job post uses where it genuinely applies.",
  "Never invent employers, dates, tools, degrees or metrics. If the CV lacks something the job asks for, say so in honestGaps rather than fabricating it.",
  "Write in plain British English. No buzzword padding.",
].join(" ");

const inputClass =
  "w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3.5 outline-none placeholder:text-[var(--text-faint)] focus:border-[var(--brand-bright)]";

export function CvRevamp() {
  const [cvText, setCvText] = useState("");
  const [cvName, setCvName] = useState("");
  const [jobPost, setJobPost] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsKey, setNeedsKey] = useState(false);
  const [result, setResult] = useState<RevampResult | null>(null);
  const [copied, setCopied] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    try {
      const text = await readDocument(file);
      setCvText(text);
      setCvName(file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't read that file.");
    }
  }

  const ready = cvText.trim().length > 80 && jobPost.trim().length > 40;

  async function revamp() {
    if (!ready || busy) return;
    setBusy(true);
    setError(null);
    setResult(null);

    const prompt = [
      "Here is the job the candidate is applying for:",
      jobPost.trim(),
      "",
      "Here is their current CV:",
      cvText.trim(),
      "",
      "Respond with ONLY valid JSON, no markdown fences, in this exact shape:",
      '{"revampedCv":"the full rewritten CV as plain text with line breaks",',
      '"changes":[{"change":"what you changed","why":"why it helps for this job"}],',
      '"missingKeywords":["terms the job asks for that the CV never mentions"],',
      '"honestGaps":["requirements this candidate genuinely does not meet"]}',
    ].join("\n");

    try {
      const { data } = await callInteractionJson<RevampResult>(prompt, {
        systemInstruction: SYSTEM_INSTRUCTION,
      });
      setResult(data);
    } catch (err) {
      if (err instanceof MissingKeyError) {
        setNeedsKey(true);
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    }
    setBusy(false);
  }

  function copyCv() {
    if (!result) return;
    void navigator.clipboard.writeText(result.revampedCv).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function downloadCv() {
    if (!result) return;
    const blob = new Blob([result.revampedCv], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "revamped-cv.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  if (needsKey) return <ApiKeyPrompt what="revamping your CV" />;

  return (
    <main className="mx-auto max-w-[1100px] px-6 py-10 lg:px-10">
      <h1 className="text-[36px] font-bold leading-tight">
        Revamp the CV you already have.
      </h1>
      <p className="mt-4 max-w-[70ch] leading-relaxed text-[var(--text-muted)]">
        Bring your CV and the job you&apos;re going for, and it gets rewritten to match.
      </p>

      {/*
        One container holding both inputs and the action, rather than two cards
        with a loose button underneath. The button belongs to this form, so it
        sits in the form's footer — floating it below meant it drifted further
        down the page every time a textarea grew.
      */}
      <section className="mt-8 overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)]">
        {/* gap-px over the border colour draws the divider between the two
            columns without either needing a border of its own. */}
        <div className="grid gap-px bg-[var(--border)] lg:grid-cols-2">
          <div className="flex flex-col bg-[var(--surface)] p-6">
            <p className="flex items-center gap-2 font-semibold">
              <span className="grid size-6 place-items-center rounded-full bg-[var(--brand-dim)] text-xs font-bold text-[var(--brand-bright)]">
                1
              </span>
              Your current CV
            </p>

            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.txt,.md,application/pdf,text/plain"
              className="sr-only"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="mt-4 flex w-full items-center gap-3 rounded-[var(--radius)] border border-dashed border-[var(--border-strong)] px-4 py-3 text-left transition-colors hover:bg-[var(--surface-2)]"
            >
              <Upload className="size-4 shrink-0 text-[var(--brand-bright)]" />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                {cvName || "Upload a PDF or TXT"}
              </span>
            </button>

            <p className="my-2.5 text-center text-xs text-[var(--text-faint)]">
              or paste it
            </p>
            {/* flex-1 on both textareas is what holds the two columns to the
                same height — they were rows=8 against rows=16. */}
            <textarea
              value={cvText}
              onChange={(e) => {
                setCvText(e.target.value);
                setCvName("");
              }}
              placeholder="Paste your CV text here…"
              className={`${inputClass} min-h-[190px] flex-1 resize-none`}
            />
          </div>

          <div className="flex flex-col bg-[var(--surface)] p-6">
            <p className="flex items-center gap-2 font-semibold">
              <span className="grid size-6 place-items-center rounded-full bg-[var(--brand-dim)] text-xs font-bold text-[var(--brand-bright)]">
                2
              </span>
              The job you want
            </p>
            <textarea
              value={jobPost}
              onChange={(e) => setJobPost(e.target.value)}
              placeholder="Paste the full job post — title, responsibilities, and the skills they ask for. The more you paste, the better the match."
              className={`${inputClass} mt-4 min-h-[190px] flex-1 resize-none`}
            />
          </div>
        </div>

        {/* Helper text and the error share one slot, so surfacing an error
            cannot change the height of anything. */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] px-6 py-4">
          <p
            role={error ? "alert" : undefined}
            className={`min-w-0 flex-1 text-sm ${
              error ? "text-[var(--danger)]" : "text-[var(--text-faint)]"
            }`}
          >
            {error ??
              "Read in this browser and sent straight to Google with your own key."}
          </p>
          <button
            type="button"
            onClick={revamp}
            disabled={!ready || busy}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-[var(--radius)] bg-[var(--brand)] px-6 py-3 font-semibold text-white transition-colors hover:bg-[var(--brand-hover)] disabled:cursor-not-allowed disabled:bg-[var(--surface-3)] disabled:text-[var(--text-faint)]"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {busy ? "Rewriting…" : "Revamp my CV"}
          </button>
        </div>
      </section>

      {result ? (
        <div className="mt-12 space-y-8">
          <section>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <FileText className="size-5 text-[var(--brand-bright)]" />
                Your revamped CV
              </h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={copyCv}
                  className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-[var(--surface-3)]"
                >
                  {copied ? (
                    <Check className="size-4 text-[var(--brand-bright)]" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  type="button"
                  onClick={downloadCv}
                  className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-[var(--surface-3)]"
                >
                  <Download className="size-4" />
                  Download
                </button>
              </div>
            </div>
            <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-6 font-sans text-sm leading-relaxed">
              {result.revampedCv}
            </pre>
          </section>

          {result.changes?.length ? (
            <section>
              <h2 className="text-xl font-bold">What changed, and why</h2>
              <ul className="mt-4 space-y-3">
                {result.changes.map((item, i) => (
                  <li
                    key={i}
                    className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5"
                  >
                    <p className="font-semibold">{item.change}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">
                      {item.why}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {result.missingKeywords?.length ? (
            <section>
              <h2 className="text-xl font-bold">
                Terms the job uses that your CV doesn&apos;t
              </h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {result.missingKeywords.map((keyword, i) => (
                  <li
                    key={i}
                    className="rounded-full bg-[var(--warn-dim)] px-3.5 py-1.5 text-sm text-[var(--warn)]"
                  >
                    {keyword}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {result.honestGaps?.length ? (
            <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-6">
              <h2 className="text-xl font-bold">
                What you genuinely don&apos;t have yet
              </h2>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                These weren&apos;t added to your CV, because they aren&apos;t
                true. Worth knowing before the interview.
              </p>
              <ul className="mt-4 space-y-2">
                {result.honestGaps.map((gap, i) => (
                  <li
                    key={i}
                    className="flex gap-3 leading-relaxed text-[var(--text-muted)]"
                  >
                    <span className="text-[var(--text-faint)]">—</span>
                    {gap}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
