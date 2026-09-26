"use client";

import { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Download,
  Loader2,
  RotateCcw,
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

const STEPS = ["Your details", "Revamped CV", "What changed"];

export function CvRevamp() {
  const [cvText, setCvText] = useState("");
  const [cvName, setCvName] = useState("");
  const [jobPost, setJobPost] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsKey, setNeedsKey] = useState(false);
  const [result, setResult] = useState<RevampResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState(1);

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
      setStep(2);
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

  function startOver() {
    setResult(null);
    setStep(1);
    setError(null);
  }

  if (needsKey) return <ApiKeyPrompt what="revamping your CV" />;

  return (
    // Fixed to the viewport with one scrolling pane inside, so a long CV
    // scrolls in place rather than stretching the page.
    <main className="mx-auto flex h-dvh max-w-[1100px] flex-col px-6 py-8 lg:px-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[26px] font-bold">Revamp My CV</h1>

        {/* Steps 2 and 3 stay unreachable until there is something to show,
            rather than being hidden — so the shape of the flow is visible
            from the first screen. */}
        <nav className="flex items-center gap-1.5">
          {STEPS.map((label, i) => {
            const n = i + 1;
            const reachable = n === 1 || result !== null;
            return (
              <button
                key={label}
                type="button"
                disabled={!reachable}
                onClick={() => setStep(n)}
                className={[
                  "rounded-full px-3.5 py-1.5 text-sm transition-colors",
                  step === n
                    ? "bg-[var(--brand-dim)] font-semibold text-[var(--brand-bright)]"
                    : reachable
                      ? "text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
                      : "cursor-not-allowed text-[var(--text-faint)] opacity-50",
                ].join(" ")}
              >
                <span className="mr-1.5 font-mono text-xs">{n}</span>
                {label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* ---------------- Step 1: the inputs ---------------- */}
      {step === 1 ? (
        <section className="mt-6 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)]">
          <div className="grid min-h-0 flex-1 gap-px bg-[var(--border)] lg:grid-cols-2">
            <div className="flex min-h-0 flex-col bg-[var(--surface)] p-6">
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
              <textarea
                value={cvText}
                onChange={(e) => {
                  setCvText(e.target.value);
                  setCvName("");
                }}
                placeholder="Paste your CV text here…"
                className={`${inputClass} min-h-[160px] flex-1 resize-none`}
              />
            </div>

            <div className="flex min-h-0 flex-col bg-[var(--surface)] p-6">
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
                className={`${inputClass} mt-4 min-h-[160px] flex-1 resize-none`}
              />
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] px-6 py-4">
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
      ) : null}

      {/* ---------------- Step 2: the rewritten CV ---------------- */}
      {step === 2 && result ? (
        <section className="mt-6 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)]">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-6 py-4">
            <p className="font-semibold">Your revamped CV</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={copyCv}
                className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-sm font-semibold transition-colors hover:bg-[var(--surface-3)]"
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
                className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-sm font-semibold transition-colors hover:bg-[var(--surface-3)]"
              >
                <Download className="size-4" />
                Download
              </button>
            </div>
          </div>

          {/* The CV is the only thing that scrolls here. */}
          <pre className="min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap px-6 py-6 font-sans text-sm leading-relaxed">
            {result.revampedCv}
          </pre>

          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[var(--border)] px-6 py-4">
            <button
              type="button"
              onClick={startOver}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
            >
              <RotateCcw className="size-4" />
              Start over
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-2 rounded-[var(--radius)] bg-[var(--brand)] px-6 py-3 font-semibold text-white transition-colors hover:bg-[var(--brand-hover)]"
            >
              What changed
              <ArrowRight className="size-4" />
            </button>
          </div>
        </section>
      ) : null}

      {/* ---------------- Step 3: everything about the rewrite ---------------- */}
      {step === 3 && result ? (
        <section className="mt-6 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)]">
          <div className="min-h-0 flex-1 space-y-8 overflow-y-auto px-6 py-6">
            {result.changes?.length ? (
              <div>
                <h2 className="font-bold">What changed, and why</h2>
                <ul className="mt-3 space-y-2.5">
                  {result.changes.map((item, i) => (
                    <li
                      key={i}
                      className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-4"
                    >
                      <p className="text-sm font-semibold">{item.change}</p>
                      <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">
                        {item.why}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {result.missingKeywords?.length ? (
              <div>
                <h2 className="font-bold">
                  Terms the job uses that your CV doesn&apos;t
                </h2>
                <p className="mt-1.5 text-sm text-[var(--text-muted)]">
                  Worth working in honestly, if they genuinely describe what you
                  did.
                </p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {result.missingKeywords.map((keyword, i) => (
                    <li
                      key={i}
                      className="rounded-full bg-[var(--warn-dim)] px-3.5 py-1.5 text-sm text-[var(--warn)]"
                    >
                      {keyword}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {result.honestGaps?.length ? (
              <div>
                <h2 className="font-bold">
                  What you genuinely don&apos;t have yet
                </h2>
                <p className="mt-1.5 text-sm text-[var(--text-muted)]">
                  These weren&apos;t added to your CV, because they aren&apos;t
                  true. Worth knowing before the interview.
                </p>
                <ul className="mt-3 space-y-2">
                  {result.honestGaps.map((gap, i) => (
                    <li
                      key={i}
                      className="flex gap-3 text-sm leading-relaxed text-[var(--text-muted)]"
                    >
                      <span className="text-[var(--text-faint)]">—</span>
                      {gap}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[var(--border)] px-6 py-4">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
            >
              <ArrowLeft className="size-4" />
              Back to the CV
            </button>
            <button
              type="button"
              onClick={startOver}
              className="inline-flex items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] px-6 py-3 font-semibold transition-colors hover:bg-[var(--surface-3)]"
            >
              <RotateCcw className="size-4" />
              Revamp another
            </button>
          </div>
        </section>
      ) : null}
    </main>
  );
}
